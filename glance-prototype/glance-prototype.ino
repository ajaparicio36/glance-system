#include <GlanceFirmware.h>
#if __has_include("config.local.h")
#include "config.local.h"
#else
#include "config.example.h"
#endif

static bool ready = false;

void setup() {
  Serial.begin(115200);
  ready = glance::validDeviceId(deviceId) && glance::beginGps(gpsConfig) && glance::beginUplink(uplinkConfig);
  Serial.println(ready ? "Prototype ready: awaiting live GPS" : "Prototype disabled: verify configuration");
}

void loop() {
  if (ready) {
    glance::Observation observation;
    if (glance::pollGps(deviceId, observation)) glance::queueUpload(observation);
  }
  delay(5);
}
