#include "GlanceFirmware.h"
#include "GlanceTls.h"
#include "GlanceSources.h"
#include "GlanceRadioDiagnostics.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <NetworkClientSecure.h>
#include <SPI.h>
#include <LoRa.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>
#include <mbedtls/md.h>
#include <sys/time.h>
#include <time.h>

namespace glance {

static HardwareSerial gpsSerial(1);
static char sentence[128] = {};
static size_t sentenceLength = 0;
static uint32_t lastObservationMs = 0;
static char lastGpsTimestamp[25] = {};
static TinyGPSPlus gpsMonitor;
static uint32_t gpsObservations = 0;
static uint32_t lastGpsReportMs = 0;
static const char *gpsState = "no_rmc";
static UplinkConfig uplinkConfig;
static QueueHandle_t uploadQueues[sourceSlots] = {};
static RadioConfig radioConfig;
static uint8_t radioKey[32] = {};
static SourceReplay radioSources;
static uint32_t transmissionStartedMs = 0;
static bool radioTransmitting = false;
static RadioDiagnostics radioDiagnostics;
static const char *radioState = "not_started";
static const char *uplinkState = "not_started";
static uint32_t lastRadioReportMs = 0;

static bool initFailed(const char *component, const char *&state, const char *reason) {
  state = reason;
  Serial.printf("%s init failed: %s\n", component, reason);
  return false;
}

const char *radioInitStatus() { return radioState; }
const char *uplinkInitStatus() { return uplinkState; }

void reportRadioDiagnostics() {
  const uint32_t now = millis();
  if (static_cast<uint32_t>(now - lastRadioReportMs) < observationIntervalMs) return;
  lastRadioReportMs = now;
  Serial.printf("LoRa state=%s tx_state=%s tx_attempts=%lu tx_drop=%lu tx_written_bytes=%lu tx_started=%lu tx_bytes=%lu tx_idle_local=%lu tx_idle_bytes=%lu tx_timeout=%lu rx_packets=%lu rx_bytes=%lu rx_ok0=%lu rx_ok1=%lu\n",
                radioState, radioDiagnostics.txState,
                static_cast<unsigned long>(radioDiagnostics.txAttempts), static_cast<unsigned long>(radioDiagnostics.txDrops),
                static_cast<unsigned long>(radioDiagnostics.txWrittenBytes), static_cast<unsigned long>(radioDiagnostics.txStarted),
                static_cast<unsigned long>(radioDiagnostics.txStartedBytes), static_cast<unsigned long>(radioDiagnostics.txIdleLocal),
                static_cast<unsigned long>(radioDiagnostics.txIdleBytes), static_cast<unsigned long>(radioDiagnostics.txTimeouts),
                static_cast<unsigned long>(radioDiagnostics.rxPackets), static_cast<unsigned long>(radioDiagnostics.rxBytes),
                static_cast<unsigned long>(radioDiagnostics.rxAccepted[0]), static_cast<unsigned long>(radioDiagnostics.rxAccepted[1]));
  const uint32_t *rejected = radioDiagnostics.rejected;
  Serial.printf("LoRa reject length=%lu version=%lu hmac=%lu schema=%lu id=%lu invalid_fix=%lu replay=%lu stale=%lu clock=%lu\n",
                static_cast<unsigned long>(rejected[0]), static_cast<unsigned long>(rejected[1]), static_cast<unsigned long>(rejected[2]),
                static_cast<unsigned long>(rejected[3]), static_cast<unsigned long>(rejected[4]), static_cast<unsigned long>(rejected[5]),
                static_cast<unsigned long>(rejected[6]), static_cast<unsigned long>(rejected[7]), static_cast<unsigned long>(rejected[8]));
  if (radioDiagnostics.packetSeen) {
    Serial.printf("LoRa last_packet age_ms=%lu rssi=%d snr=%.2f\n",
                  static_cast<unsigned long>(now - radioDiagnostics.lastPacketMs), radioDiagnostics.lastRssi,
                  static_cast<double>(radioDiagnostics.lastSnr));
  } else Serial.println("LoRa last_packet=none");
}

static bool inputPin(int pin) {
  return pin >= 0 && pin < GPIO_NUM_MAX && GPIO_IS_VALID_GPIO(pin);
}

static bool outputPin(int pin) {
  return inputPin(pin) && GPIO_IS_VALID_OUTPUT_GPIO(pin);
}

bool beginGps(const GpsConfig &config) {
  if (!config.wiringVerified || !inputPin(config.rxPin) ||
      (config.txPin != -1 && (!outputPin(config.txPin) || config.txPin == config.rxPin)) ||
      config.baud == 0) return false;
  if (gpsSerial.setRxBufferSize(2048) != 2048) return false;
  gpsSerial.begin(config.baud, SERIAL_8N1, config.rxPin, config.txPin);
  return static_cast<bool>(gpsSerial);
}

static bool parseGps(const char *deviceId, Observation &observation) {
  if (sentenceLength < 7 || sentence[0] != '$' || strncmp(sentence + 3, "RMC,", 4) != 0) return false;
  gpsState = "rmc_fields_or_no_fix";
  char validation[sizeof(sentence)];
  memcpy(validation, sentence, sentenceLength + 1);
  if (!completeRmc(validation)) return false;
  TinyGPSPlus parser;
  bool accepted = false;
  for (size_t index = 0; index < sentenceLength; ++index) accepted = parser.encode(sentence[index]) || accepted;
  accepted = parser.encode('\n') || accepted;
  gpsState = "checksum_or_parser_fields";
  if (!accepted || !parser.location.isValid() || !parser.date.isValid() || !parser.time.isValid() ||
      !parser.location.isUpdated() || !parser.date.isUpdated() || !parser.time.isUpdated()) return false;
  Observation candidate;
  gpsState = "invalid_id_coordinate_utc";
  if (!validDeviceId(deviceId)) return false;
  strcpy(candidate.deviceId, deviceId);
  candidate.latitude = parser.location.lat();
  candidate.longitude = parser.location.lng();
  snprintf(candidate.observedAt, sizeof(candidate.observedAt), "%04u-%02u-%02uT%02u:%02u:%02u.%03uZ",
           static_cast<unsigned>(parser.date.year()), static_cast<unsigned>(parser.date.month()),
           static_cast<unsigned>(parser.date.day()), static_cast<unsigned>(parser.time.hour()),
           static_cast<unsigned>(parser.time.minute()), static_cast<unsigned>(parser.time.second()),
           static_cast<unsigned>(parser.time.centisecond()) * 10);
  candidate.receivedAtMs = millis();
  if (!validObservation(candidate)) return false;
  gpsState = "duplicate_or_older_utc";
  if (!newerThan(candidate, lastGpsTimestamp)) return false;
  gpsState = "cadence_wait";
  if (static_cast<uint32_t>(candidate.receivedAtMs - lastObservationMs) < observationIntervalMs) return false;
  observation = candidate;
  strcpy(lastGpsTimestamp, candidate.observedAt);
  lastObservationMs = candidate.receivedAtMs;
  const timeval gpsTime = {static_cast<time_t>(timestampSeconds(candidate.observedAt)),
                          static_cast<suseconds_t>(decimal(candidate.observedAt + 20, 3) * 1000)};
  settimeofday(&gpsTime, nullptr);
  ++gpsObservations;
  gpsState = "emitted";
  return true;
}

bool pollGps(const char *deviceId, Observation &observation) {
  bool updated = false;
  size_t readCount = 0;
  while (gpsSerial.available() && readCount++ < 1024) {
    const char character = static_cast<char>(gpsSerial.read());
    gpsMonitor.encode(character);
    if (character == '$') sentenceLength = 0;
    if (character == '\n') {
      sentence[sentenceLength] = '\0';
      if (sentenceLength > 0 && parseGps(deviceId, observation)) updated = true;
      sentenceLength = 0;
    } else if (character != '\r') {
      if (sentenceLength < sizeof(sentence) - 1) sentence[sentenceLength++] = character;
      else sentenceLength = 0;
    }
  }
  const uint32_t now = millis();
  if (static_cast<uint32_t>(now - lastGpsReportMs) >= observationIntervalMs) {
    Serial.printf("GPS bytes=%lu ok=%lu bad=%lu sat=%ld sat_age_ms=%lu fix_age_ms=%lu\n",
                  static_cast<unsigned long>(gpsMonitor.charsProcessed()),
                  static_cast<unsigned long>(gpsMonitor.passedChecksum()),
                  static_cast<unsigned long>(gpsMonitor.failedChecksum()),
                  gpsMonitor.satellites.isValid() ? static_cast<long>(gpsMonitor.satellites.value()) : -1L,
                  static_cast<unsigned long>(gpsMonitor.satellites.age()),
                  static_cast<unsigned long>(gpsMonitor.location.age()));
    Serial.printf("GPS rmc=%s emitted=%lu obs_age_ms=%lu utc=%s date_seen=%u time_seen=%u\n", gpsState,
                  static_cast<unsigned long>(gpsObservations),
                  static_cast<unsigned long>(gpsObservations ? now - lastObservationMs : UINT32_MAX),
                  gpsObservations ? lastGpsTimestamp : "none",
                  static_cast<unsigned>(gpsMonitor.date.isValid()), static_cast<unsigned>(gpsMonitor.time.isValid()));
    lastGpsReportMs = now;
  }
  return updated;
}

static size_t encodeJson(const Observation &observation, char *body, size_t capacity) {
  JsonDocument document;
  document["deviceId"] = observation.deviceId;
  document["latitude"] = observation.latitude;
  document["longitude"] = observation.longitude;
  document["observedAt"] = observation.observedAt;
  if (document.overflowed() || measureJson(document) >= capacity) return 0;
  return serializeJson(document, body, capacity);
}

static const char *urlError(const UplinkConfig &config) {
  const String url(config.url);
  if (url.length() > 256) return "url_too_long";
  if (url.indexOf('\r') >= 0 || url.indexOf('\n') >= 0) return "url_line_break";
  if (url.indexOf('@') >= 0) return "url_credentials_forbidden";
  if (!url.endsWith("/api/locations")) return "url_endpoint_invalid";
  if (url.startsWith("https://")) {
    if (!tlsTrustAvailable(config.rootCa)) return "tls_trust_unavailable";
    return url.length() > 26 ? nullptr : "url_host_invalid";
  }
  if (!url.startsWith("http://")) return "url_scheme_invalid";
  if (!config.allowTrustedLanHttp) return "http_lan_opt_in_missing";
  const int slash = url.indexOf('/', 7);
  if (slash < 0) return "url_host_invalid";
  String host = url.substring(7, slash);
  const int colon = host.indexOf(':');
  if (colon >= 0) host = host.substring(0, colon);
  IPAddress address;
  if (!address.fromString(host)) return "http_requires_private_ipv4";
  const bool privateAddress = address[0] == 10 || (address[0] == 172 && address[1] >= 16 && address[1] <= 31) ||
                              (address[0] == 192 && address[1] == 168);
  return privateAddress ? nullptr : "http_requires_private_ipv4";
}

static bool upload(const Observation &observation, const char *&state, int &httpStatus) {
  timeval now;
  gettimeofday(&now, nullptr);
  state = "expired_or_clock_skew";
  if (!freshAt(observation, millis(), static_cast<int64_t>(now.tv_sec) * 1000 + now.tv_usec / 1000)) return false;
  const bool secure = strncmp(uplinkConfig.url, "https://", 8) == 0;
  state = "tls_clock_wait";
  if (secure && time(nullptr) < 1704067200) return false;
  char body[maxJsonBytes + 1];
  const size_t length = encodeJson(observation, body, sizeof(body));
  state = "json_failed";
  if (length == 0) return false;
  NetworkClient plainClient;
  NetworkClientSecure secureClient;
  state = "tls_trust_unavailable";
  if (secure && !configureTlsTrust(secureClient, uplinkConfig.rootCa)) return false;
  secureClient.setHandshakeTimeout(3);
  NetworkClient &client = secure ? static_cast<NetworkClient &>(secureClient) : plainClient;
  HTTPClient http;
  http.setConnectTimeout(2000);
  http.setTimeout(2000);
  http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
  state = "http_begin_failed";
  if (!http.begin(client, uplinkConfig.url)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + uplinkConfig.deviceToken);
  const int status = http.POST(reinterpret_cast<uint8_t *>(body), length);
  httpStatus = status;
  state = status == 200 ? "http_200" : "http_failed";
  http.end();
  Serial.printf("Upload HTTP status: %d\n", status);
  return status == 200;
}

static void uplinkTask(void *) {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(false);
  configTime(0, 0, uplinkConfig.ntpServer);
  uint32_t lastConnectMs = millis() - 10000;
  PendingUplinks pending;
  pending.configure(uplinkConfig.deviceId, uplinkConfig.secondDeviceId);
  uint32_t lastReportMs = millis() - observationIntervalMs / 2;
  uint32_t attempts = 0;
  int lastHttpStatus = 0;
  const char *uploadState = "awaiting_observation";
  const char *lastDeviceId = "none";
  for (;;) {
    for (size_t slot = 0; slot < sourceSlots; ++slot) {
      Observation incoming;
      if (uploadQueues[slot] && xQueueReceive(uploadQueues[slot], &incoming, 0) == pdTRUE) {
        timeval receivedTime;
        gettimeofday(&receivedTime, nullptr);
        if (pending.store(incoming, millis(), static_cast<int64_t>(receivedTime.tv_sec) * 1000 + receivedTime.tv_usec / 1000)) {
          uploadState = "queued";
        }
      }
    }
    const uint32_t now = millis();
    timeval wallTime;
    gettimeofday(&wallTime, nullptr);
    const int64_t wallTimeMs = static_cast<int64_t>(wallTime.tv_sec) * 1000 + wallTime.tv_usec / 1000;
    if (WiFi.status() != WL_CONNECTED && static_cast<uint32_t>(now - lastConnectMs) >= 10000) {
      WiFi.disconnect();
      WiFi.begin(uplinkConfig.ssid, uplinkConfig.password);
      lastConnectMs = now;
    }
    const uint32_t previousExpired = pending.expired;
    const int due = pending.nextDue(now, wallTimeMs, WiFi.status() == WL_CONNECTED);
    if (pending.expired != previousExpired) uploadState = "expired_or_clock_skew";
    if (due >= 0) {
      ++attempts;
      lastDeviceId = due == 0 ? uplinkConfig.deviceId : uplinkConfig.secondDeviceId;
      if (upload(pending.latest[due], uploadState, lastHttpStatus)) pending.hasPending[due] = false;
    }
    if (static_cast<uint32_t>(now - lastReportMs) >= observationIntervalMs) {
      Serial.printf("Uplink wifi=%d pending=%u device=%s state=%s attempts=%lu http=%d expired=%lu clock=%s\n",
                    static_cast<int>(WiFi.status()), pending.pendingCount(), lastDeviceId, uploadState,
                    static_cast<unsigned long>(attempts), lastHttpStatus, static_cast<unsigned long>(pending.expired),
                    wallTime.tv_sec >= 1704067200 ? "ready" : "unset");
      lastReportMs = now;
    }
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

bool beginUplink(const UplinkConfig &config) {
  if (!validSourceIds(config.deviceId, config.secondDeviceId)) return initFailed("Uplink", uplinkState, "ids_invalid_or_duplicate");
  if (!config.ssid || strlen(config.ssid) == 0) return initFailed("Uplink", uplinkState, "ssid_missing");
  if (!config.deviceToken || strlen(config.deviceToken) < 32) return initFailed("Uplink", uplinkState, "device_token_short_or_missing");
  if (strchr(config.deviceToken, '\r') || strchr(config.deviceToken, '\n')) return initFailed("Uplink", uplinkState, "device_token_line_break");
  if (!config.url) return initFailed("Uplink", uplinkState, "url_missing");
  const char *reason = urlError(config);
  if (reason) return initFailed("Uplink", uplinkState, reason);
  if (strncmp(config.url, "https://", 8) == 0) {
    Serial.println(config.rootCa && config.rootCa[0] ? "TLS trust: explicit rootCa override" : "TLS trust: built-in public CA bundle");
  }
  uplinkConfig = config;
  for (size_t slot = 0; slot < sourceSlots; ++slot) {
    if (slot == 1 && config.secondDeviceId[0] == '\0') continue;
    uploadQueues[slot] = xQueueCreate(1, sizeof(Observation));
    if (!uploadQueues[slot]) {
      for (size_t previous = 0; previous < slot; ++previous) {
        vQueueDelete(uploadQueues[previous]);
        uploadQueues[previous] = nullptr;
      }
      return initFailed("Uplink", uplinkState, "queue_allocation_failed");
    }
  }
  if (xTaskCreate(uplinkTask, "glance-uplink", 8192, nullptr, 1, nullptr) != pdPASS) {
    for (size_t slot = 0; slot < sourceSlots; ++slot) {
      if (uploadQueues[slot]) vQueueDelete(uploadQueues[slot]);
      uploadQueues[slot] = nullptr;
    }
    return initFailed("Uplink", uplinkState, "task_creation_failed");
  }
  uplinkState = "ready";
  Serial.println("Uplink init ready: network task started (not proof of WiFi/HTTP)");
  return true;
}

void queueUpload(const Observation &observation) {
  const int slot = sourceIndex(observation.deviceId, uplinkConfig.deviceId, uplinkConfig.secondDeviceId);
  if (slot >= 0 && uploadQueues[slot] && validObservation(observation) && fresh(observation, millis())) {
    xQueueOverwrite(uploadQueues[slot], &observation);
  }
}

bool disjointGpsRadioPins(const GpsConfig &gps, const RadioConfig &radio) {
  const int radioPins[] = {radio.sckPin, radio.misoPin, radio.mosiPin, radio.csPin, radio.resetPin, radio.dio0Pin};
  for (const int pin : radioPins) if (pin == gps.rxPin || (gps.txPin != -1 && pin == gps.txPin)) return false;
  return true;
}

static int hexDigit(char character) {
  if (character >= '0' && character <= '9') return character - '0';
  if (character >= 'a' && character <= 'f') return character - 'a' + 10;
  if (character >= 'A' && character <= 'F') return character - 'A' + 10;
  return -1;
}

bool beginRadio(const RadioConfig &config) {
  Serial.printf("Radio init config: sck=%d miso=%d mosi=%d nss=%d reset=%d dio0=%d hz=%ld power_dbm=%d\n",
                config.sckPin, config.misoPin, config.mosiPin, config.csPin, config.resetPin, config.dio0Pin, config.frequencyHz, config.txPowerDbm);
  if (!config.wiringAndBandVerified) return initFailed("Radio", radioState, "verification_gate_disabled");
  if (!validSourceIds(config.sourceDeviceId, config.secondSourceDeviceId)) return initFailed("Radio", radioState, "ids_invalid_or_duplicate");
  if (!config.keyHex || strlen(config.keyHex) != 64) return initFailed("Radio", radioState, "key_length_invalid");
  if (config.frequencyHz < 137000000 || config.frequencyHz > 1020000000) return initFailed("Radio", radioState, "frequency_out_of_range");
  if (config.txPowerDbm < 2 || config.txPowerDbm > 17) return initFailed("Radio", radioState, "power_out_of_range");
  const int pins[] = {config.sckPin, config.misoPin, config.mosiPin, config.csPin, config.resetPin, config.dio0Pin};
  for (size_t index = 0; index < 6; ++index) {
    if (index == 4 && pins[index] == -1) continue;
    if ((index == 1 || index == 5) ? !inputPin(pins[index]) : !outputPin(pins[index])) return initFailed("Radio", radioState, "pin_invalid");
    for (size_t previous = 0; previous < index; ++previous) if (pins[previous] == pins[index]) return initFailed("Radio", radioState, "pin_duplicate");
  }
  uint8_t nonzero = 0;
  for (size_t index = 0; index < sizeof(radioKey); ++index) {
    const int high = hexDigit(config.keyHex[index * 2]);
    const int low = hexDigit(config.keyHex[index * 2 + 1]);
    if (high < 0 || low < 0) return initFailed("Radio", radioState, "key_hex_invalid");
    radioKey[index] = static_cast<uint8_t>((high << 4) | low);
    nonzero |= radioKey[index];
  }
  if (nonzero == 0) return initFailed("Radio", radioState, "key_all_zero");
  radioConfig = config;
  radioSources.configure(config.sourceDeviceId, config.secondSourceDeviceId);
  if (!SPI.begin(config.sckPin, config.misoPin, config.mosiPin, config.csPin)) return initFailed("Radio", radioState, "spi_begin_failed");
  LoRa.setPins(config.csPin, config.resetPin, config.dio0Pin);
  if (!LoRa.begin(config.frequencyHz)) return initFailed("Radio", radioState, "chip_not_detected");
  LoRa.setTxPower(config.txPowerDbm);
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125000);
  LoRa.setCodingRate4(5);
  LoRa.setPreambleLength(8);
  LoRa.setSyncWord(0x47);
  LoRa.enableCrc();
  radioState = "ready";
  Serial.println("Radio init ready (not proof of RF delivery)");
  return true;
}

static bool authenticate(const uint8_t *data, size_t length, uint8_t *tag) {
  constexpr char domain[] = "GLANCE-LORA-V1";
  uint8_t message[sizeof(domain) - 1 + 1 + maxJsonBytes];
  if (length > 1 + maxJsonBytes) return false;
  memcpy(message, domain, sizeof(domain) - 1);
  memcpy(message + sizeof(domain) - 1, data, length);
  const mbedtls_md_info_t *algorithm = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  return algorithm && mbedtls_md_hmac(algorithm, radioKey, sizeof(radioKey), message, sizeof(domain) - 1 + length, tag) == 0;
}

void serviceRadioTransmission() {
  if (strcmp(radioState, "ready") != 0) return;
  if (radioTransmitting) {
    const bool idle = LoRa.beginPacket() != 0;
    if (!idle && static_cast<uint32_t>(millis() - transmissionStartedMs) < 2000) return;
    LoRa.idle();
    radioTransmitting = false;
    radioDiagnostics.finished(!idle);
  }
}

bool sendRadio(const Observation &observation) {
  addCounter(radioDiagnostics.txAttempts);
  if (strcmp(radioState, "ready") != 0) return radioDiagnostics.dropTx("not_ready");
  serviceRadioTransmission();
  if (radioTransmitting) return radioDiagnostics.dropTx("busy");
  if (!validObservation(observation) || !fresh(observation, millis())) return radioDiagnostics.dropTx("invalid_or_stale_fix");
  if (strcmp(observation.deviceId, radioConfig.sourceDeviceId) != 0) return radioDiagnostics.dropTx("source_id_mismatch");
  uint8_t frame[maxFrameBytes];
  frame[0] = 1;
  char body[maxJsonBytes + 1];
  const size_t length = encodeJson(observation, body, sizeof(body));
  if (!length) return radioDiagnostics.dropTx("json_failed");
  memcpy(frame + 1, body, length);
  if (!authenticate(frame, 1 + length, frame + 1 + length)) return radioDiagnostics.dropTx("hmac_failed");
  if (!LoRa.beginPacket()) return radioDiagnostics.dropTx("begin_packet_failed");
  const size_t written = LoRa.write(frame, 1 + length + tagBytes);
  addCounter(radioDiagnostics.txWrittenBytes, static_cast<uint32_t>(written));
  if (written != 1 + length + tagBytes || !LoRa.endPacket(true)) {
    LoRa.idle();
    return radioDiagnostics.dropTx("write_or_start_failed");
  }
  transmissionStartedMs = millis();
  radioTransmitting = true;
  radioDiagnostics.started(static_cast<uint32_t>(1 + length + tagBytes));
  return true;
}

bool receiveRadio(Observation &observation) {
  if (strcmp(radioState, "ready") != 0) return false;
  const int length = LoRa.parsePacket();
  if (length <= 0) return false;
  radioDiagnostics.parsed(millis(), LoRa.packetRssi(), LoRa.packetSnr());
  if (length > static_cast<int>(maxFrameBytes)) {
    while (LoRa.available()) {
      if (LoRa.read() < 0) break;
      addCounter(radioDiagnostics.rxBytes);
    }
    return radioDiagnostics.reject(RadioReject::Length);
  }
  uint8_t frame[maxFrameBytes];
  size_t received = 0;
  while (LoRa.available() && received < sizeof(frame)) {
    const int value = LoRa.read();
    if (value < 0) break;
    frame[received++] = static_cast<uint8_t>(value);
    addCounter(radioDiagnostics.rxBytes);
  }
  if (received != static_cast<size_t>(length) || received <= 1 + tagBytes) return radioDiagnostics.reject(RadioReject::Length);
  if (!validFrameSize(received, frame[0])) return radioDiagnostics.reject(RadioReject::Version);
  const size_t authenticatedLength = received - tagBytes;
  uint8_t expected[tagBytes];
  if (!authenticate(frame, authenticatedLength, expected) || !equalTag(expected, frame + authenticatedLength)) return radioDiagnostics.reject(RadioReject::Mac);
  JsonDocument document;
  if (deserializeJson(document, frame + 1, authenticatedLength - 1, DeserializationOption::NestingLimit(1)) ||
      !document.is<JsonObject>() || document.size() != 4 || !document["deviceId"].is<const char *>() ||
      !document["observedAt"].is<const char *>() || !document["latitude"].is<double>() || !document["longitude"].is<double>()) return radioDiagnostics.reject(RadioReject::Schema);
  const char *deviceId = document["deviceId"].as<const char *>();
  const char *timestamp = document["observedAt"].as<const char *>();
  const int slot = sourceIndex(deviceId, radioConfig.sourceDeviceId, radioConfig.secondSourceDeviceId);
  if (slot < 0 || !validDeviceId(deviceId)) return radioDiagnostics.reject(RadioReject::Identity);
  if (!validTimestamp(timestamp)) return radioDiagnostics.reject(RadioReject::InvalidFix);
  Observation candidate;
  strcpy(candidate.deviceId, deviceId);
  strcpy(candidate.observedAt, timestamp);
  candidate.latitude = document["latitude"].as<double>();
  candidate.longitude = document["longitude"].as<double>();
  candidate.receivedAtMs = millis();
  timeval now;
  gettimeofday(&now, nullptr);
  if (!validObservation(candidate)) return radioDiagnostics.reject(RadioReject::InvalidFix);
  if (now.tv_sec < 1704067200) return radioDiagnostics.reject(RadioReject::Clock);
  const int64_t ageMs = static_cast<int64_t>(now.tv_sec) * 1000 + now.tv_usec / 1000 - timestampMilliseconds(candidate.observedAt);
  if (!acceptableAge(ageMs)) return radioDiagnostics.reject(RadioReject::Stale);
  candidate.receivedAtMs -= static_cast<uint32_t>(ageMs > 0 ? ageMs : 0);
  if (!newerThan(candidate, radioSources.lastTimestamp[slot])) return radioDiagnostics.reject(RadioReject::Replay);
  if (!radioSources.accept(candidate, millis(), static_cast<int64_t>(now.tv_sec) * 1000 + now.tv_usec / 1000)) return radioDiagnostics.reject(RadioReject::Stale);
  observation = candidate;
  addCounter(radioDiagnostics.rxAccepted[slot]);
  return true;
}

}
