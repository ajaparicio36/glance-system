#pragma once

constexpr char deviceId[] = "prototype-001";
const glance::GpsConfig gpsConfig = [] {
  glance::GpsConfig config;
  config.rxPin = -1;
  config.txPin = -1;
  config.baud = 9600;
  config.wiringVerified = false;
  return config;
}();
const glance::UplinkConfig uplinkConfig = [] {
  glance::UplinkConfig config;
  config.ssid = "";
  config.password = "";
  config.url = "https://glance-server-qo82.onrender.com/api/locations";
  config.deviceToken = "";
  config.rootCa = "";
  config.allowTrustedLanHttp = false;
  return config;
}();
