#include "GlanceSources.h"
#include <cassert>
#include <cstdio>
#include <iostream>
#include <limits>

static glance::Observation fix(const char *deviceId, unsigned second = 10, uint32_t receivedAtMs = 10000, unsigned millisecond = 0) {
  glance::Observation observation;
  std::snprintf(observation.deviceId, sizeof(observation.deviceId), "%s", deviceId);
  std::snprintf(observation.observedAt, sizeof(observation.observedAt), "2026-10-26T00:00:%02u.%03uZ", second, millisecond);
  observation.latitude = 14.5;
  observation.longitude = 121;
  observation.receivedAtMs = receivedAtMs;
  return observation;
}

int main() {
  constexpr char first[] = "prototype-001";
  constexpr char second[] = "slave-02";
  const int64_t wall = glance::timestampMilliseconds(fix(first).observedAt);
  assert(glance::validSourceIds(first, second));
  assert(glance::validSourceIds(first, ""));
  assert(!glance::validSourceIds(first, first));
  assert(!glance::validSourceIds("bad id", second));
  assert(!glance::validSourceIds(first, "bad id"));
  assert(!glance::validSourceIds(first, nullptr));
  assert(glance::sourceIndex("unknown", first, second) == -1);

  glance::SourceReplay replay;
  assert(replay.configure(first, second));
  assert(replay.accept(fix(first), 10000, wall));
  assert(replay.accept(fix(second), 10000, wall));
  assert(!replay.accept(fix(first), 10000, wall));
  assert(!replay.accept(fix(second), 10000, wall));
  assert(!replay.accept(fix(first, 9), 10000, wall));
  assert(!replay.accept(fix("unknown", 11), 10000, wall));
  assert(!replay.accept(fix(first, 11), 10000, wall + 16000));
  assert(!replay.accept(fix(first, 16), 10000, wall));
  assert(!replay.accept(fix(first, 11), 10000, 0));
  assert(!replay.accept(fix(first, 11), 30000, wall + 1000));
  auto invalid = fix(first, 11);
  invalid.latitude = 91;
  assert(!replay.accept(invalid, 10000, wall + 1000));
  assert(replay.accept(fix(first, 11), 10000, wall + 1000));
  assert(replay.accept(fix(second, 11), 10000, wall + 1000));

  glance::PendingUplinks pending;
  assert(pending.configure(first, second));
  assert(pending.store(fix(first), 10000, wall));
  assert(pending.store(fix(second), 10000, wall));
  assert(pending.pendingCount() == 2);
  assert(pending.nextDue(10000, wall) == 0);
  for (unsigned millisecond = 1; millisecond <= 100; ++millisecond) {
    assert(pending.store(fix(first, 10, 10000, millisecond), 10000, wall));
    assert(pending.hasPending[1]);
    assert(strcmp(pending.latest[1].deviceId, second) == 0);
  }
  assert(pending.nextDue(10000, wall) == 1);
  pending.hasPending[1] = false;
  assert(strcmp(pending.latest[0].observedAt, "2026-10-26T00:00:10.100Z") == 0);
  assert(pending.nextDue(14999, wall + 4999) == -1);
  assert(pending.store(fix(second, 14, 14999), 14999, wall + 4999));
  assert(!pending.store(fix(second, 13, 14999), 14999, wall + 4999));
  assert(!pending.store(fix("unknown", 14, 14999), 14999, wall + 4999));
  assert(pending.nextDue(15000, wall + 5000) == 0);
  assert(pending.nextDue(15000, wall + 5000) == 1);
  assert(pending.nextDue(15001, wall + 5001) == -1);
  assert(pending.store(fix(first, 19, 19999), 19999, wall + 9999));
  assert(pending.store(fix(second, 19, 19999), 19999, wall + 9999));
  assert(pending.nextDue(19999, wall + 9999) == -1);
  assert(pending.nextDue(20000, wall + 10000) == 0);
  assert(pending.nextDue(20000, wall + 10000) == 1);

  glance::PendingUplinks expiry;
  assert(expiry.configure(first, second));
  assert(expiry.store(fix(first), 10000, wall));
  assert(expiry.store(fix(second, 25, 25000), 25000, wall + 15000));
  assert(expiry.nextDue(25000, wall + 15000, false) == -1);
  assert(!expiry.hasPending[0] && expiry.hasPending[1]);
  assert(expiry.expired == 1);
  assert(!expiry.attempted[1]);
  assert(expiry.nextDue(25000, wall + 15000) == 1);

  glance::PendingUplinks single;
  assert(single.configure(first, ""));
  assert(!single.store(fix(second), 10000, wall));
  assert(single.store(fix(first), 10000, wall));
  assert(single.nextDue(10000, wall) == 0);
  assert(single.nextDue(10001, wall + 1) == -1);
  assert(single.nextDue(25000, wall + 15000) == -1);
  assert(single.expired == 1);

  const uint32_t beforeWrap = std::numeric_limits<uint32_t>::max() - 1000;
  const uint32_t afterWrap = beforeWrap + 5000;
  glance::PendingUplinks wrapped;
  assert(wrapped.configure(first, second));
  assert(wrapped.store(fix(first, 10, beforeWrap), beforeWrap, wall));
  assert(wrapped.nextDue(beforeWrap, wall) == 0);
  assert(wrapped.nextDue(afterWrap - 1, wall + 4999) == -1);
  assert(wrapped.nextDue(afterWrap, wall + 5000) == 0);
  glance::StaggeredRadio immediate;
  assert(immediate.store(fix(first), first, true, 10000));
  assert(immediate.due(first, true, 10000));
  assert(!immediate.due(first, true, 10000));
  glance::StaggeredRadio staggered;
  assert(!staggered.store(fix(second), second, false, 10000));
  assert(!staggered.store(fix(first), second, true, 10000));
  assert(staggered.store(fix(second), second, true, 10000));
  assert(!staggered.store(fix(second), second, true, 10000));
  assert(!staggered.due(second, true, 10999));
  assert(staggered.due(second, true, 11000));
  assert(!staggered.due(second, true, 11001));
  assert(staggered.store(fix(second), second, true, 10000));
  assert(!staggered.due(second, false, 11000));
  assert(!staggered.pending);
  assert(staggered.store(fix(second), second, true, 10000));
  assert(!staggered.due(first, true, 11000));
  assert(!staggered.pending);
  assert(staggered.store(fix(second), second, true, 10000));
  assert(!staggered.due(second, true, 25000));
  assert(!staggered.pending);
  assert(!staggered.store(fix(second, 10, 10001), second, true, 10000));
  assert(staggered.store(fix(second, 10, beforeWrap), second, true, beforeWrap));
  assert(!staggered.due(second, true, beforeWrap + 999));
  assert(staggered.due(second, true, beforeWrap + 1000));
  std::cout << "Two-source replay/freshness, equal UTC, unknown IDs, per-ID coalescing/cadence, failed-peer fairness, offline expiry, single-source, rollover and nonblocking TX stagger/cancellation checks passed\n";
}
