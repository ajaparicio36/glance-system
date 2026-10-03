#pragma once

#include <Arduino.h>
#include <HardwareSerial.h>
#include "GlanceProtocol.h"

namespace glance {

struct GpsConfig {
  int rxPin = -1;
  int txPin = -1;
  unsigned long baud = 9600;
  bool wiringVerified = false;
};

struct UplinkConfig {
  const char *ssid = "";
  const char *password = "";
  const char *url = "";
  const char *deviceToken = "";
  const char *rootCa = "";
  const char *ntpServer = "pool.ntp.org";
  bool allowTrustedLanHttp = false;
};

struct RadioConfig {
  int sckPin = -1;
  int misoPin = -1;
  int mosiPin = -1;
  int csPin = -1;
  int resetPin = -1;
  int dio0Pin = -1;
  long frequencyHz = 0;
  int txPowerDbm = 2;
  const char *keyHex = "";
  const char *sourceDeviceId = "";
  bool wiringAndBandVerified = false;
};

bool beginGps(const GpsConfig &config);
bool pollGps(const char *deviceId, Observation &observation);
bool beginUplink(const UplinkConfig &config);
void queueUpload(const Observation &observation);
bool beginRadio(const RadioConfig &config);
bool sendRadio(const Observation &observation);
void serviceRadioTransmission();
bool receiveRadio(Observation &observation);
bool disjointGpsRadioPins(const GpsConfig &gps, const RadioConfig &radio);

}
