#pragma once

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
  config.sourceDeviceId = "slave-01";
  config.wiringAndBandVerified = false;
  return config;
}();
const glance::UplinkConfig uplinkConfig = [] {
  glance::UplinkConfig config;
  config.ssid = "";
  config.password = "";
  config.url = "";
  config.deviceToken = "";
  config.rootCa = "";
  config.allowTrustedLanHttp = false;
  return config;
}();
