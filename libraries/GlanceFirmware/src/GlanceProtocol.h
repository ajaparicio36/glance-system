#pragma once

#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstring>

namespace glance {

constexpr uint32_t observationIntervalMs = 5000;
constexpr uint32_t staleIntervalMs = 15000;
constexpr int64_t maxFutureSkewMs = 5000;
constexpr size_t maxJsonBytes = 200;
constexpr size_t tagBytes = 32;
constexpr size_t maxFrameBytes = 1 + maxJsonBytes + tagBytes;

struct Observation {
  char deviceId[65] = {};
  double latitude = 0;
  double longitude = 0;
  char observedAt[25] = {};
  uint32_t receivedAtMs = 0;
};

inline bool validDeviceId(const char *deviceId) {
  const size_t length = strlen(deviceId);
  if (length == 0 || length > 64) return false;
  for (size_t index = 0; index < length; ++index) {
    const char character = deviceId[index];
    if (!((character >= 'a' && character <= 'z') ||
          (character >= 'A' && character <= 'Z') ||
          (character >= '0' && character <= '9') ||
          (index > 0 && (character == '.' || character == '-' || character == '_')))) return false;
  }
  return true;
}

inline bool leapYear(unsigned year) {
  return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
}

inline unsigned decimal(const char *value, size_t length) {
  unsigned result = 0;
  for (size_t index = 0; index < length; ++index) result = result * 10 + value[index] - '0';
  return result;
}

inline bool digits(const char *value, size_t length) {
  for (size_t index = 0; index < length; ++index) if (value[index] < '0' || value[index] > '9') return false;
  return true;
}

inline bool coordinateField(const char *value, size_t degrees) {
  const size_t length = strlen(value);
  if (length < degrees + 4 || value[degrees + 2] != '.' || !digits(value, degrees + 2) ||
      !digits(value + degrees + 3, length - degrees - 3)) return false;
  return decimal(value + degrees, 2) < 60;
}

inline bool completeRmc(char *line) {
  char *fields[13] = {};
  size_t count = 0;
  char *cursor = line;
  fields[count++] = cursor;
  while (*cursor && count < 13) {
    if (*cursor == ',') {
      *cursor = '\0';
      fields[count++] = cursor + 1;
    }
    ++cursor;
  }
  if (count < 10 || strlen(fields[0]) != 6 || fields[0][0] != '$' || strcmp(fields[0] + 3, "RMC") != 0 ||
      strcmp(fields[2], "A") != 0 || strlen(fields[9]) != 6 || !digits(fields[9], 6)) return false;
  const size_t timeLength = strlen(fields[1]);
  if (timeLength < 6 || !digits(fields[1], 6) ||
      (timeLength > 6 && (timeLength < 8 || fields[1][6] != '.' || !digits(fields[1] + 7, timeLength - 7)))) return false;
  return coordinateField(fields[3], 2) && coordinateField(fields[5], 3) &&
         (strcmp(fields[4], "N") == 0 || strcmp(fields[4], "S") == 0) &&
         (strcmp(fields[6], "E") == 0 || strcmp(fields[6], "W") == 0);
}

inline bool validTimestamp(const char *timestamp) {
  if (strlen(timestamp) != 24) return false;
  for (size_t index = 0; index < 24; ++index) {
    const char expected = index == 4 || index == 7 ? '-' : index == 10 ? 'T' :
                          index == 13 || index == 16 ? ':' : index == 19 ? '.' : index == 23 ? 'Z' : '\0';
    if (expected ? timestamp[index] != expected : timestamp[index] < '0' || timestamp[index] > '9') return false;
  }
  const unsigned year = decimal(timestamp, 4);
  const unsigned month = decimal(timestamp + 5, 2);
  const unsigned day = decimal(timestamp + 8, 2);
  constexpr unsigned days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
  return month >= 1 && month <= 12 && day >= 1 &&
         day <= days[month - 1] + (month == 2 && leapYear(year) ? 1 : 0) &&
         decimal(timestamp + 11, 2) < 24 && decimal(timestamp + 14, 2) < 60 &&
         decimal(timestamp + 17, 2) < 60;
}

inline int64_t timestampSeconds(const char *timestamp) {
  const unsigned year = decimal(timestamp, 4);
  const unsigned month = decimal(timestamp + 5, 2);
  constexpr unsigned days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
  int64_t elapsedDays = 0;
  for (unsigned current = 1970; current < year; ++current) elapsedDays += leapYear(current) ? 366 : 365;
  for (unsigned current = year; current < 1970; ++current) elapsedDays -= leapYear(current) ? 366 : 365;
  for (unsigned current = 1; current < month; ++current) elapsedDays += days[current - 1] + (current == 2 && leapYear(year) ? 1 : 0);
  elapsedDays += decimal(timestamp + 8, 2) - 1;
  return elapsedDays * 86400 + decimal(timestamp + 11, 2) * 3600 +
         decimal(timestamp + 14, 2) * 60 + decimal(timestamp + 17, 2);
}

inline int64_t timestampMilliseconds(const char *timestamp) {
  return timestampSeconds(timestamp) * 1000 + decimal(timestamp + 20, 3);
}

inline bool acceptableAge(int64_t ageMs) {
  return ageMs >= -maxFutureSkewMs && ageMs < staleIntervalMs;
}

inline bool validObservation(const Observation &observation) {
  return validDeviceId(observation.deviceId) && validTimestamp(observation.observedAt) &&
         std::isfinite(observation.latitude) && std::isfinite(observation.longitude) &&
         observation.latitude >= -90 && observation.latitude <= 90 &&
         observation.longitude >= -180 && observation.longitude <= 180;
}

inline bool newerThan(const Observation &observation, const char *previousTimestamp) {
  return strcmp(observation.observedAt, previousTimestamp) > 0;
}

inline bool fresh(const Observation &observation, uint32_t now) {
  return static_cast<uint32_t>(now - observation.receivedAtMs) < staleIntervalMs;
}

inline bool freshAt(const Observation &observation, uint32_t now, int64_t epochMs) {
  return fresh(observation, now) && acceptableAge(epochMs - timestampMilliseconds(observation.observedAt));
}

inline bool equalTag(const uint8_t *expected, const uint8_t *received) {
  uint8_t difference = 0;
  for (size_t index = 0; index < tagBytes; ++index) difference |= expected[index] ^ received[index];
  return difference == 0;
}

inline bool validFrameSize(size_t length, uint8_t version) {
  return version == 1 && length > 1 + tagBytes && length <= maxFrameBytes;
}

}
