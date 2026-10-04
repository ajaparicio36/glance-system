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
  ready = glance::validDeviceId(deviceId) && glance::beginGps(gpsConfig) && glance::beginUplink(uplinkConfig);
  Serial.println(ready ? "Prototype ready: awaiting live GPS" : "Prototype disabled: verify configuration");
  lastStatusMs = millis();
}

void loop() {
  if (ready) {
    glance::Observation observation;
    if (glance::pollGps(deviceId, observation)) glance::queueUpload(observation);
  }
  const uint32_t now = millis();
  if (static_cast<uint32_t>(now - lastStatusMs) >= 5000) {
    Serial.printf("Prototype alive, uptime %lu s: %s\n", static_cast<unsigned long>(now / 1000),
                  ready ? "ready; GPS polling active (not proof of a fix/upload)" : "disabled; verify configuration");
    lastStatusMs = now;
  }
  delay(5);
}
