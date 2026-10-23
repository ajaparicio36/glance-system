#include <GlanceFirmware.h>
#if __has_include("config.local.h")
#include "config.local.h"
#else
#include "config.example.h"
#endif

static bool ready = false;
static uint32_t lastStatusMs = 0;

void setup() {
  Serial.begin(115200);
#if ARDUINO_USB_CDC_ON_BOOT && ARDUINO_USB_MODE
  Serial.setTxTimeoutMs(0);
#endif
  const uint32_t serialWaitStartedMs = millis();
  while (!Serial && static_cast<uint32_t>(millis() - serialWaitStartedMs) < 2000) delay(10);
  ready = glance::beginRadio(radioConfig) && glance::beginUplink(uplinkConfig);
  Serial.println(ready ? "Master ready: awaiting clock sync and authenticated radio" : "Master disabled: verify configuration");
  lastStatusMs = millis();
}

void loop() {
  if (ready) {
    glance::Observation observation;
    if (glance::receiveRadio(observation)) glance::queueUpload(observation);
  }
  const uint32_t now = millis();
  if (static_cast<uint32_t>(now - lastStatusMs) >= 5000) {
    Serial.printf("Master alive, uptime %lu s: %s\n", static_cast<unsigned long>(now / 1000),
                  ready ? "ready; radio polling active (not proof of reception/upload); system time required" : "disabled; verify radio/uplink configuration");
    lastStatusMs = now;
  }
  delay(5);
}
