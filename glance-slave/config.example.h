#pragma once

constexpr char deviceId[] = "prototype-001"; // Slave 1: keep the existing tracker identity.
// constexpr char deviceId[] = "slave-02"; // Slave 2: select this instead before flashing the second board.
const glance::GpsConfig gpsConfig = [] {
  glance::GpsConfig config;
  config.rxPin = 20;
  config.txPin = 21;
  config.baud = 9600;
  config.wiringVerified = false;
  return config;
}();
const glance::RadioConfig radioConfig = [] {
  glance::RadioConfig config;
  config.sckPin = 4;
  config.misoPin = 7;
  config.mosiPin = 6;
  config.csPin = 10;
  config.resetPin = -1;
  config.dio0Pin = 2;
  config.frequencyHz = 915000000;
  config.txPowerDbm = 2;
  config.keyHex = "";
  config.sourceDeviceId = deviceId;
  config.wiringAndBandVerified = false;
  return config;
}();
