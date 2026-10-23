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
  ready = glance::validDeviceId(deviceId) && strcmp(deviceId, radioConfig.sourceDeviceId) == 0 &&
          glance::disjointGpsRadioPins(gpsConfig, radioConfig) && glance::beginGps(gpsConfig) && glance::beginRadio(radioConfig);
  Serial.println(ready ? "Slave ready: awaiting live GPS" : "Slave disabled: verify configuration");
  lastStatusMs = millis();
}

void loop() {
  if (ready) {
    glance::serviceRadioTransmission();
    glance::Observation observation;
    if (glance::pollGps(deviceId, observation)) {
      Serial.println(glance::sendRadio(observation) ? "Observation transmitted asynchronously" : "Radio observation dropped");
    }
  }
  const uint32_t now = millis();
  if (static_cast<uint32_t>(now - lastStatusMs) >= 5000) {
    Serial.printf("Slave alive, uptime %lu s: %s\n", static_cast<unsigned long>(now / 1000),
                  ready ? "ready; GPS/radio active (not proof of a fix/delivery)" : "disabled; verify GPS/radio configuration");
    lastStatusMs = now;
  }
  delay(5);
}
