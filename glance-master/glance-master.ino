#include <GlanceFirmware.h>
#if __has_include("config.local.h")
#include "config.local.h"
static const char *configSource = "LOCAL";
#else
#include "config.example.h"
static const char *configSource = "EXAMPLE";
#endif

static bool radioReady = false;
static bool uplinkReady = false;
static uint32_t lastStatusMs = 0;

void setup() {
  Serial.begin(115200);
#if ARDUINO_USB_CDC_ON_BOOT && ARDUINO_USB_MODE
  Serial.setTxTimeoutMs(0);
#endif
  const uint32_t serialWaitStartedMs = millis();
  while (!Serial && static_cast<uint32_t>(millis() - serialWaitStartedMs) < 2000) delay(10);
  Serial.printf("Master config source=%s\n", configSource);
  radioReady = glance::beginRadio(radioConfig);
  uplinkReady = glance::beginUplink(uplinkConfig);
  Serial.println("Master initialized: check radio/uplink states; clock sync and authenticated fixes still required");
  lastStatusMs = millis();
}

void loop() {
  if (radioReady) {
    glance::Observation observation;
    if (glance::receiveRadio(observation) && uplinkReady) glance::queueUpload(observation);
  }
  const uint32_t now = millis();
  if (static_cast<uint32_t>(now - lastStatusMs) >= 5000) {
    Serial.printf("Master alive, uptime %lu s: config=%s radio=%s radio_state=%s uplink=%s uplink_state=%s\n", static_cast<unsigned long>(now / 1000),
                  configSource, radioReady ? "ready" : "disabled", glance::radioInitStatus(), uplinkReady ? "ready" : "disabled", glance::uplinkInitStatus());
    lastStatusMs = now;
  }
  glance::reportRadioDiagnostics();
  delay(5);
}
