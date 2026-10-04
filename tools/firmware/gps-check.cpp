#include "GlanceProtocol.h"
#include <TinyGPS++.h>
#include <cassert>
#include <cstdio>
#include <iostream>
#include <string>

static unsigned long nowMs = 0;
unsigned long millis() { return nowMs; }

static std::string nmea(const std::string &body) {
  uint8_t checksum = 0;
  for (const char character : body) checksum ^= static_cast<uint8_t>(character);
  char suffix[6];
  std::snprintf(suffix, sizeof(suffix), "*%02X\r\n", static_cast<unsigned>(checksum));
  return "$" + body + suffix;
}

static bool feed(TinyGPSPlus &parser, const std::string &line) {
  bool accepted = false;
  for (const char character : line) accepted = parser.encode(character) || accepted;
  return accepted;
}

int main() {
  TinyGPSPlus monitor;
  const std::string inactive = nmea("GPRMC,030405.00,V,,,,,,,041026,,,N");
  assert(feed(monitor, inactive));
  assert(monitor.passedChecksum() == 1 && !monitor.location.isValid());
  std::string corrupted = nmea("GPRMC,030405.00,A,1435.9700,N,12059.0520,E,0.0,0.0,041026,,,A");
  corrupted[10] = corrupted[10] == '0' ? '1' : '0';
  assert(!feed(monitor, corrupted));
  assert(monitor.failedChecksum() == 1 && !monitor.location.isValid());
  nowMs = 6000;
  const std::string valid = nmea("GPRMC,030405.12,A,1435.9700,N,12059.0520,E,0.0,0.0,041026,,,A");
  assert(feed(monitor, valid));
  assert(monitor.location.isValid() && monitor.location.age() == 0);
  TinyGPSPlus uploadParser;
  assert(feed(uploadParser, valid));
  assert(uploadParser.location.isUpdated() && uploadParser.date.isUpdated() && uploadParser.time.isUpdated());
  char validation[128];
  std::strcpy(validation, valid.c_str());
  assert(glance::completeRmc(validation));
  glance::Observation observation;
  std::strcpy(observation.deviceId, "prototype-001");
  observation.latitude = uploadParser.location.lat();
  observation.longitude = uploadParser.location.lng();
  std::snprintf(observation.observedAt, sizeof(observation.observedAt), "%04u-%02u-%02uT%02u:%02u:%02u.%03uZ",
                static_cast<unsigned>(uploadParser.date.year()), static_cast<unsigned>(uploadParser.date.month()),
                static_cast<unsigned>(uploadParser.date.day()), static_cast<unsigned>(uploadParser.time.hour()),
                static_cast<unsigned>(uploadParser.time.minute()), static_cast<unsigned>(uploadParser.time.second()),
                static_cast<unsigned>(uploadParser.time.centisecond()) * 10);
  assert(glance::validObservation(observation));
  assert(std::strcmp(observation.observedAt, "2026-10-04T03:04:05.120Z") == 0);
  assert(feed(monitor, nmea("GPGGA,030405.12,1435.9700,N,12059.0520,E,1,05,1.2,0.0,M,0.0,M,,")));
  assert(monitor.satellites.isValid() && monitor.satellites.value() == 5);
  nowMs += 15000;
  assert(monitor.location.age() == 15000 && monitor.satellites.age() == 15000);
  assert(monitor.charsProcessed() > 0 && monitor.passedChecksum() == 3);
  std::cout << "Installed TinyGPSPlus checksum/fix/UTC/diagnostic checks passed\n";
}
