#pragma once

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
  config.sourceDeviceId = "prototype-001";
  config.secondSourceDeviceId = "slave-02";
  config.wiringAndBandVerified = false;
  return config;
}();
const glance::UplinkConfig uplinkConfig = [] {
  glance::UplinkConfig config;
  config.ssid = "";
  config.password = "";
  config.url = "https://glance-server-production.up.railway.app/api/locations";
  config.deviceToken = "";
  config.rootCa = "";
  config.deviceId = "prototype-001";
  config.secondDeviceId = "slave-02";
  config.allowTrustedLanHttp = false;
  return config;
}();
