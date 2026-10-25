#include <GlanceFirmware.h>
#include <GlanceSources.h>
#if __has_include("config.local.h")
#include "config.local.h"
#else
#include "config.example.h"
#endif

static bool gpsReady = false;
static bool radioReady = false;
static uint32_t lastStatusMs = 0;
static glance::StaggeredRadio radioPending;

void setup() {
  Serial.begin(115200);
#if ARDUINO_USB_CDC_ON_BOOT && ARDUINO_USB_MODE
  Serial.setTxTimeoutMs(0);
#endif
  const uint32_t serialWaitStartedMs = millis();
  while (!Serial && static_cast<uint32_t>(millis() - serialWaitStartedMs) < 2000) delay(10);
  gpsReady = glance::validDeviceId(deviceId) && strcmp(deviceId, radioConfig.sourceDeviceId) == 0 &&
             glance::disjointGpsRadioPins(gpsConfig, radioConfig) && glance::beginGps(gpsConfig);
  radioReady = gpsReady && glance::beginRadio(radioConfig);
  Serial.println(gpsReady ? "Slave GPS active: awaiting live fix" : "Slave GPS disabled: verify identity/GPS/pin separation");
  Serial.println(radioReady ? "Slave radio ready (not proof of delivery)" : "Slave radio disabled: verify band/wiring/power/antenna");
  lastStatusMs = millis();
}

void loop() {
  if (gpsReady) {
    if (radioReady) glance::serviceRadioTransmission();
    glance::Observation observation;
    if (glance::pollGps(deviceId, observation)) {
      radioPending.store(observation, deviceId, radioReady, millis());
      if (!radioReady) Serial.println("GPS observation ready; radio disabled (not transmitted)");
    }
  }
  const uint32_t now = millis();
  if (radioPending.due(deviceId, gpsReady && radioReady, now)) {
    Serial.println(glance::sendRadio(radioPending.observation) ? "Observation transmitted asynchronously" : "Radio observation dropped");
  }
  if (static_cast<uint32_t>(now - lastStatusMs) >= 5000) {
    Serial.printf("Slave alive, uptime %lu s: GPS=%s radio=%s (not proof of a fix/delivery)\n", static_cast<unsigned long>(now / 1000),
                  gpsReady ? "active" : "disabled", radioReady ? "ready" : "disabled");
    lastStatusMs = now;
  }
  delay(5);
}
