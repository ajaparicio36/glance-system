#pragma once

#include "GlanceProtocol.h"

namespace glance {

constexpr size_t sourceSlots = 2;

inline bool validSourceIds(const char *primary, const char *secondary) {
  return primary && secondary && validDeviceId(primary) &&
         (secondary[0] == '\0' || (validDeviceId(secondary) && strcmp(primary, secondary) != 0));
}

inline int sourceIndex(const char *deviceId, const char *primary, const char *secondary) {
  if (!deviceId) return -1;
  if (strcmp(deviceId, primary) == 0) return 0;
  if (secondary[0] != '\0' && strcmp(deviceId, secondary) == 0) return 1;
  return -1;
}

struct SourceReplay {
  const char *primary = "";
  const char *secondary = "";
  char lastTimestamp[sourceSlots][25] = {};

  bool configure(const char *first, const char *second) {
    if (!validSourceIds(first, second)) return false;
    primary = first;
    secondary = second;
    memset(lastTimestamp, 0, sizeof(lastTimestamp));
    return true;
  }

  bool accept(const Observation &observation, uint32_t nowMs, int64_t wallTimeMs) {
    const int slot = sourceIndex(observation.deviceId, primary, secondary);
    if (slot < 0 || !validObservation(observation) || !freshAt(observation, nowMs, wallTimeMs) ||
        !newerThan(observation, lastTimestamp[slot])) return false;
    strcpy(lastTimestamp[slot], observation.observedAt);
    return true;
  }
};

struct PendingUplinks {
  SourceReplay sources;
  Observation latest[sourceSlots];
  bool hasPending[sourceSlots] = {};
  bool attempted[sourceSlots] = {};
  uint32_t lastAttemptMs[sourceSlots] = {};
  size_t next = 0;
  uint32_t expired = 0;

  bool configure(const char *primary, const char *secondary) {
    if (!sources.configure(primary, secondary)) return false;
    memset(hasPending, 0, sizeof(hasPending));
    memset(attempted, 0, sizeof(attempted));
    memset(lastAttemptMs, 0, sizeof(lastAttemptMs));
    next = 0;
    expired = 0;
    return true;
  }

  bool store(const Observation &observation, uint32_t nowMs, int64_t wallTimeMs) {
    if (!sources.accept(observation, nowMs, wallTimeMs)) return false;
    const int slot = sourceIndex(observation.deviceId, sources.primary, sources.secondary);
    latest[slot] = observation;
    hasPending[slot] = true;
    return true;
  }

  int nextDue(uint32_t nowMs, int64_t wallTimeMs, bool connected = true) {
    for (size_t slot = 0; slot < sourceSlots; ++slot) {
      if (hasPending[slot] && !freshAt(latest[slot], nowMs, wallTimeMs)) {
        hasPending[slot] = false;
        ++expired;
      }
    }
    if (!connected) return -1;
    for (size_t offset = 0; offset < sourceSlots; ++offset) {
      const size_t slot = (next + offset) % sourceSlots;
      if (!hasPending[slot] || (attempted[slot] && static_cast<uint32_t>(nowMs - lastAttemptMs[slot]) < observationIntervalMs)) continue;
      attempted[slot] = true;
      lastAttemptMs[slot] = nowMs;
      next = (slot + 1) % sourceSlots;
      return static_cast<int>(slot);
    }
    return -1;
  }

  unsigned pendingCount() const {
    unsigned count = 0;
    for (const bool pending : hasPending) if (pending) ++count;
    return count;
  }
};

struct StaggeredRadio {
  Observation observation;
  bool pending = false;

  bool store(const Observation &candidate, const char *deviceId, bool enabled, uint32_t nowMs) {
    if (!enabled) {
      pending = false;
      return false;
    }
    if (strcmp(candidate.deviceId, deviceId) != 0 || !validObservation(candidate) || !fresh(candidate, nowMs) ||
        (pending && !newerThan(candidate, observation.observedAt))) return false;
    observation = candidate;
    pending = true;
    return true;
  }

  bool due(const char *deviceId, bool enabled, uint32_t nowMs) {
    if (!pending) return false;
    if (!enabled || strcmp(observation.deviceId, deviceId) != 0 || !validObservation(observation) || !fresh(observation, nowMs)) {
      pending = false;
      return false;
    }
    const uint32_t delayMs = strcmp(deviceId, "slave-02") == 0 ? 1000 : 0;
    if (static_cast<uint32_t>(nowMs - observation.receivedAtMs) < delayMs) return false;
    pending = false;
    return true;
  }
};

}
