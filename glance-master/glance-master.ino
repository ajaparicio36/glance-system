#include <GlanceFirmware.h>
#if __has_include("config.local.h")
#include "config.local.h"
#else
#include "config.example.h"
#endif

static bool ready = false;

void setup() {
  Serial.begin(115200);
  ready = glance::beginRadio(radioConfig) && glance::beginUplink(uplinkConfig);
  Serial.println(ready ? "Master ready: awaiting clock sync and authenticated radio" : "Master disabled: verify configuration");
}

void loop() {
  if (ready) {
    glance::Observation observation;
    if (glance::receiveRadio(observation)) glance::queueUpload(observation);
  }
  delay(5);
}
