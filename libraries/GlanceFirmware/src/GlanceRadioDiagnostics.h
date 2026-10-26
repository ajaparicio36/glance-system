#pragma once

#include <cstddef>
#include <cstdint>

namespace glance {

enum class RadioReject : size_t { Length, Version, Mac, Schema, Identity, InvalidFix, Replay, Stale, Clock, Count };

inline void addCounter(uint32_t &counter, uint32_t amount = 1) {
  const uint32_t maximum = UINT32_MAX;
  counter = amount > maximum - counter ? maximum : counter + amount;
}

struct RadioDiagnostics {
  uint32_t txAttempts = 0;
  uint32_t txDrops = 0;
  uint32_t txWrittenBytes = 0;
  uint32_t txStarted = 0;
  uint32_t txStartedBytes = 0;
  uint32_t txIdleLocal = 0;
  uint32_t txIdleBytes = 0;
  uint32_t txTimeouts = 0;
  uint32_t inFlightBytes = 0;
  uint32_t rxPackets = 0;
  uint32_t rxBytes = 0;
  uint32_t rxAccepted[2] = {};
  uint32_t rejected[static_cast<size_t>(RadioReject::Count)] = {};
  bool packetSeen = false;
  uint32_t lastPacketMs = 0;
  int lastRssi = 0;
  float lastSnr = 0;
  const char *txState = "no_attempt";

  bool reject(RadioReject reason) {
    addCounter(rejected[static_cast<size_t>(reason)]);
    return false;
  }

  bool dropTx(const char *reason) {
    addCounter(txDrops);
    txState = reason;
    return false;
  }

  void started(uint32_t bytes) {
    addCounter(txStarted);
    addCounter(txStartedBytes, bytes);
    inFlightBytes = bytes;
    txState = "started";
  }

  void finished(bool timeout) {
    if (timeout) {
      addCounter(txTimeouts);
      txState = "timeout";
    } else {
      addCounter(txIdleLocal);
      addCounter(txIdleBytes, inFlightBytes);
      txState = "idle_local";
    }
    inFlightBytes = 0;
  }

  void parsed(uint32_t nowMs, int rssi, float snr) {
    addCounter(rxPackets);
    packetSeen = true;
    lastPacketMs = nowMs;
    lastRssi = rssi;
    lastSnr = snr;
  }
};

}
