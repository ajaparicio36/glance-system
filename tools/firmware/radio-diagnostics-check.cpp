#include "GlanceRadioDiagnostics.h"
#include <cassert>
#include <iostream>
#include <limits>

int main() {
  glance::RadioDiagnostics diagnostics;
  assert(!diagnostics.packetSeen);
  assert(diagnostics.rxPackets == 0 && diagnostics.rxBytes == 0);
  assert(diagnostics.txAttempts == 0 && diagnostics.txStarted == 0);
  glance::addCounter(diagnostics.txAttempts);
  assert(!diagnostics.dropTx("busy"));
  assert(diagnostics.txAttempts == 1 && diagnostics.txDrops == 1);
  assert(diagnostics.txStartedBytes == 0 && diagnostics.txIdleBytes == 0);
  glance::addCounter(diagnostics.txWrittenBytes, 100);
  diagnostics.started(100);
  assert(diagnostics.txStarted == 1 && diagnostics.txStartedBytes == 100);
  assert(diagnostics.txIdleLocal == 0);
  diagnostics.finished(false);
  assert(diagnostics.txIdleLocal == 1 && diagnostics.txIdleBytes == 100);
  assert(diagnostics.inFlightBytes == 0);
  diagnostics.started(80);
  diagnostics.finished(true);
  assert(diagnostics.txStarted == 2 && diagnostics.txStartedBytes == 180);
  assert(diagnostics.txTimeouts == 1 && diagnostics.txIdleBytes == 100);
  diagnostics.parsed(1234, -101, -4.5f);
  glance::addCounter(diagnostics.rxBytes, 45);
  assert(diagnostics.packetSeen && diagnostics.rxPackets == 1 && diagnostics.rxBytes == 45);
  assert(diagnostics.lastPacketMs == 1234 && diagnostics.lastRssi == -101 && diagnostics.lastSnr == -4.5f);
  for (size_t index = 0; index < static_cast<size_t>(glance::RadioReject::Count); ++index) {
    assert(!diagnostics.reject(static_cast<glance::RadioReject>(index)));
    assert(diagnostics.rejected[index] == 1);
  }
  glance::addCounter(diagnostics.rxAccepted[0]);
  glance::addCounter(diagnostics.rxAccepted[1], 2);
  assert(diagnostics.rxAccepted[0] == 1 && diagnostics.rxAccepted[1] == 2);
  uint32_t saturated = std::numeric_limits<uint32_t>::max() - 1;
  glance::addCounter(saturated, 3);
  assert(saturated == std::numeric_limits<uint32_t>::max());
  glance::addCounter(saturated);
  assert(saturated == std::numeric_limits<uint32_t>::max());
  std::cout << "Radio diagnostic zero/attempt/write/start/local-idle/timeout/RX/reject/per-source/saturation counters passed; no receiver ACK or target crypto claimed\n";
}
