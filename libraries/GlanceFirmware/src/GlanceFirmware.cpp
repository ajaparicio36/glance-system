#include "GlanceFirmware.h"
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
static QueueHandle_t uploadQueue = nullptr;
static RadioConfig radioConfig;
static uint8_t radioKey[32] = {};
static char lastRadioTimestamp[25] = {};
static uint32_t transmissionStartedMs = 0;
static bool radioTransmitting = false;

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

static bool allowedUrl(const UplinkConfig &config) {
  const String url(config.url);
  if (url.length() > 256 || url.indexOf('\r') >= 0 || url.indexOf('\n') >= 0 ||
      url.indexOf('@') >= 0 || !url.endsWith("/api/locations")) return false;
  if (url.startsWith("https://")) return strlen(config.rootCa) > 0 && url.length() > 26;
  if (!config.allowTrustedLanHttp || !url.startsWith("http://")) return false;
  const int slash = url.indexOf('/', 7);
  if (slash < 0) return false;
  String host = url.substring(7, slash);
  const int colon = host.indexOf(':');
  if (colon >= 0) host = host.substring(0, colon);
  IPAddress address;
  if (!address.fromString(host)) return false;
  return address[0] == 10 || (address[0] == 172 && address[1] >= 16 && address[1] <= 31) ||
         (address[0] == 192 && address[1] == 168);
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
  secureClient.setCACert(uplinkConfig.rootCa);
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
  uint32_t lastAttemptMs = millis() - observationIntervalMs;
  Observation pending;
  bool hasPending = false;
  uint32_t lastReportMs = millis() - observationIntervalMs / 2;
  uint32_t attempts = 0;
  uint32_t expired = 0;
  int lastHttpStatus = 0;
  const char *uploadState = "awaiting_observation";
  for (;;) {
    Observation incoming;
    if (xQueueReceive(uploadQueue, &incoming, 0) == pdTRUE) {
      pending = incoming;
      hasPending = true;
      uploadState = "queued";
    }
    const uint32_t now = millis();
    if (WiFi.status() != WL_CONNECTED && static_cast<uint32_t>(now - lastConnectMs) >= 10000) {
      WiFi.disconnect();
      WiFi.begin(uplinkConfig.ssid, uplinkConfig.password);
      lastConnectMs = now;
    }
    timeval wallTime;
    gettimeofday(&wallTime, nullptr);
    if (hasPending && !freshAt(pending, now, static_cast<int64_t>(wallTime.tv_sec) * 1000 + wallTime.tv_usec / 1000)) {
      hasPending = false;
      ++expired;
      uploadState = "expired_or_clock_skew";
    }
    if (hasPending && WiFi.status() == WL_CONNECTED && static_cast<uint32_t>(now - lastAttemptMs) >= observationIntervalMs) {
      lastAttemptMs = now;
      ++attempts;
      if (upload(pending, uploadState, lastHttpStatus)) hasPending = false;
    }
    if (static_cast<uint32_t>(now - lastReportMs) >= observationIntervalMs) {
      Serial.printf("Uplink wifi=%d pending=%u state=%s attempts=%lu http=%d expired=%lu clock=%s\n",
                    static_cast<int>(WiFi.status()), static_cast<unsigned>(hasPending), uploadState,
                    static_cast<unsigned long>(attempts), lastHttpStatus, static_cast<unsigned long>(expired),
                    wallTime.tv_sec >= 1704067200 ? "ready" : "unset");
      lastReportMs = now;
    }
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

bool beginUplink(const UplinkConfig &config) {
  if (strlen(config.ssid) == 0 || strlen(config.deviceToken) < 32 ||
      strchr(config.deviceToken, '\r') || strchr(config.deviceToken, '\n') || !allowedUrl(config)) return false;
  uplinkConfig = config;
  uploadQueue = xQueueCreate(1, sizeof(Observation));
  if (!uploadQueue) return false;
  if (xTaskCreate(uplinkTask, "glance-uplink", 8192, nullptr, 1, nullptr) != pdPASS) {
    vQueueDelete(uploadQueue);
    uploadQueue = nullptr;
    return false;
  }
  return true;
}

void queueUpload(const Observation &observation) {
  if (uploadQueue && validObservation(observation) && fresh(observation, millis())) xQueueOverwrite(uploadQueue, &observation);
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
  if (!config.wiringAndBandVerified || !validDeviceId(config.sourceDeviceId) || strlen(config.keyHex) != 64 ||
      config.frequencyHz < 137000000 || config.frequencyHz > 1020000000 || config.txPowerDbm < 2 || config.txPowerDbm > 17) return false;
  const int pins[] = {config.sckPin, config.misoPin, config.mosiPin, config.csPin, config.resetPin, config.dio0Pin};
  for (size_t index = 0; index < 6; ++index) {
    if ((index == 1 || index == 5) ? !inputPin(pins[index]) : !outputPin(pins[index])) return false;
    for (size_t previous = 0; previous < index; ++previous) if (pins[previous] == pins[index]) return false;
  }
  uint8_t nonzero = 0;
  for (size_t index = 0; index < sizeof(radioKey); ++index) {
    const int high = hexDigit(config.keyHex[index * 2]);
    const int low = hexDigit(config.keyHex[index * 2 + 1]);
    if (high < 0 || low < 0) return false;
    radioKey[index] = static_cast<uint8_t>((high << 4) | low);
    nonzero |= radioKey[index];
  }
  if (nonzero == 0) return false;
  radioConfig = config;
  if (!SPI.begin(config.sckPin, config.misoPin, config.mosiPin, config.csPin)) return false;
  LoRa.setPins(config.csPin, config.resetPin, config.dio0Pin);
  if (!LoRa.begin(config.frequencyHz)) return false;
  LoRa.setTxPower(config.txPowerDbm);
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125000);
  LoRa.setCodingRate4(5);
  LoRa.setPreambleLength(8);
  LoRa.setSyncWord(0x47);
  LoRa.enableCrc();
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
  if (radioTransmitting) {
    if (static_cast<uint32_t>(millis() - transmissionStartedMs) < 2000 && !LoRa.beginPacket()) return;
    LoRa.idle();
    radioTransmitting = false;
  }
}

bool sendRadio(const Observation &observation) {
  serviceRadioTransmission();
  if (radioTransmitting) return false;
  if (!validObservation(observation) || !fresh(observation, millis()) || strcmp(observation.deviceId, radioConfig.sourceDeviceId) != 0) return false;
  uint8_t frame[maxFrameBytes];
  frame[0] = 1;
  char body[maxJsonBytes + 1];
  const size_t length = encodeJson(observation, body, sizeof(body));
  if (!length) return false;
  memcpy(frame + 1, body, length);
  if (!authenticate(frame, 1 + length, frame + 1 + length) || !LoRa.beginPacket()) return false;
  if (LoRa.write(frame, 1 + length + tagBytes) != 1 + length + tagBytes || !LoRa.endPacket(true)) {
    LoRa.idle();
    return false;
  }
  transmissionStartedMs = millis();
  radioTransmitting = true;
  return true;
}

bool receiveRadio(Observation &observation) {
  const int length = LoRa.parsePacket();
  if (length <= 0) return false;
  if (length > static_cast<int>(maxFrameBytes)) {
    while (LoRa.available()) LoRa.read();
    return false;
  }
  uint8_t frame[maxFrameBytes];
  size_t received = 0;
  while (LoRa.available() && received < sizeof(frame)) frame[received++] = static_cast<uint8_t>(LoRa.read());
  if (received != static_cast<size_t>(length) || !validFrameSize(received, frame[0])) return false;
  const size_t authenticatedLength = received - tagBytes;
  uint8_t expected[tagBytes];
  if (!authenticate(frame, authenticatedLength, expected) || !equalTag(expected, frame + authenticatedLength)) return false;
  JsonDocument document;
  if (deserializeJson(document, frame + 1, authenticatedLength - 1, DeserializationOption::NestingLimit(1)) ||
      !document.is<JsonObject>() || document.size() != 4 || !document["deviceId"].is<const char *>() ||
      !document["observedAt"].is<const char *>() || !document["latitude"].is<double>() || !document["longitude"].is<double>()) return false;
  const char *deviceId = document["deviceId"].as<const char *>();
  const char *timestamp = document["observedAt"].as<const char *>();
  if (strcmp(deviceId, radioConfig.sourceDeviceId) != 0 || !validDeviceId(deviceId) || !validTimestamp(timestamp)) return false;
  Observation candidate;
  strcpy(candidate.deviceId, deviceId);
  strcpy(candidate.observedAt, timestamp);
  candidate.latitude = document["latitude"].as<double>();
  candidate.longitude = document["longitude"].as<double>();
  candidate.receivedAtMs = millis();
  timeval now;
  gettimeofday(&now, nullptr);
  if (!validObservation(candidate) || !newerThan(candidate, lastRadioTimestamp) || now.tv_sec < 1704067200) return false;
  const int64_t ageMs = static_cast<int64_t>(now.tv_sec) * 1000 + now.tv_usec / 1000 - timestampMilliseconds(candidate.observedAt);
  if (!acceptableAge(ageMs)) return false;
  candidate.receivedAtMs -= static_cast<uint32_t>(ageMs > 0 ? ageMs : 0);
  strcpy(lastRadioTimestamp, candidate.observedAt);
  observation = candidate;
  return true;
}

}
