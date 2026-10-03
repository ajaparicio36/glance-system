#pragma once

constexpr char deviceId[] = "slave-01";
const glance::GpsConfig gpsConfig = [] {
  glance::GpsConfig config;
  config.rxPin = -1;
  config.txPin = -1;
  config.baud = 9600;
  config.wiringVerified = false;
  return config;
}();
const glance::RadioConfig radioConfig = [] {
  glance::RadioConfig config;
  config.sckPin = -1;
  config.misoPin = -1;
  config.mosiPin = -1;
  config.csPin = -1;
  config.resetPin = -1;
  config.dio0Pin = -1;
  config.frequencyHz = 0;
  config.txPowerDbm = 2;
  config.keyHex = "";
  config.sourceDeviceId = deviceId;
  config.wiringAndBandVerified = false;
  return config;
}();
