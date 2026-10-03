#include <GlanceFirmware.h>
#if __has_include("config.local.h")
#include "config.local.h"
#else
#include "config.example.h"
#endif

static bool ready = false;

void setup() {
  Serial.begin(115200);
  ready = glance::validDeviceId(deviceId) && strcmp(deviceId, radioConfig.sourceDeviceId) == 0 &&
          glance::disjointGpsRadioPins(gpsConfig, radioConfig) && glance::beginGps(gpsConfig) && glance::beginRadio(radioConfig);
  Serial.println(ready ? "Slave ready: awaiting live GPS" : "Slave disabled: verify configuration");
}

void loop() {
  if (ready) {
    glance::serviceRadioTransmission();
    glance::Observation observation;
    if (glance::pollGps(deviceId, observation)) {
      Serial.println(glance::sendRadio(observation) ? "Observation transmitted asynchronously" : "Radio observation dropped");
    }
  }
  delay(5);
}
