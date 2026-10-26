import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const firmware = readFileSync(new URL('../../libraries/GlanceFirmware/src/GlanceFirmware.cpp', import.meta.url), 'utf8');
const master = readFileSync(new URL('../../glance-master/glance-master.ino', import.meta.url), 'utf8');
const slave = readFileSync(new URL('../../glance-slave/glance-slave.ino', import.meta.url), 'utf8');
const radioExpression = /\n\s+radioReady = ([^;]+);/.exec(master)?.[1].replaceAll('glance::', 'glance.');
const uplinkExpression = /\n\s+uplinkReady = ([^;]+);/.exec(master)?.[1].replaceAll('glance::', 'glance.');
assert.ok(radioExpression && uplinkExpression);
for (const radio of [false, true]) {
  for (const uplink of [false, true]) {
    const called = [];
    const context = { radioConfig: {}, uplinkConfig: {}, glance: {
      beginRadio: () => { called.push('radio'); return radio; },
      beginUplink: () => { called.push('uplink'); return uplink; },
    } };
    assert.equal(vm.runInNewContext(radioExpression, context), radio);
    assert.equal(vm.runInNewContext(uplinkExpression, context), uplink);
    assert.deepEqual(called, ['radio', 'uplink']);
  }
}
assert.match(master, /if \(radioReady\) \{\s*glance::Observation observation;\s*if \(glance::receiveRadio\(observation\) && uplinkReady\) glance::queueUpload/);
for (const sketch of [master, slave]) {
  assert.match(sketch, /configSource = "LOCAL"/);
  assert.match(sketch, /configSource = "EXAMPLE"/);
  assert.match(sketch, /radio_state=%s/);
  assert.match(sketch, /alive, uptime %lu s: config=%s/);
  assert.match(sketch, /glance::reportRadioDiagnostics\(\)/);
}
for (const reason of ['verification_gate_disabled', 'ids_invalid_or_duplicate', 'key_length_invalid', 'key_hex_invalid', 'key_all_zero', 'frequency_out_of_range', 'power_out_of_range', 'pin_invalid', 'pin_duplicate', 'spi_begin_failed', 'chip_not_detected', 'ssid_missing', 'device_token_short_or_missing', 'device_token_line_break', 'queue_allocation_failed', 'task_creation_failed']) assert.ok(firmware.includes(`"${reason}"`));
for (const reason of ['Length', 'Version', 'Mac', 'Schema', 'Identity', 'InvalidFix', 'Replay', 'Stale', 'Clock']) assert.ok(firmware.includes(`radioDiagnostics.reject(RadioReject::${reason})`));
for (const log of firmware.matchAll(/Serial\.(?:printf|println)\(([\s\S]*?)\);/g)) {
  assert.ok(!/config\.(?:ssid|password|deviceToken|keyHex)|observation\.(?:latitude|longitude)/.test(log[1]));
}
const serviceBody = /void serviceRadioTransmission\(\) \{([\s\S]*?)\n\}/.exec(firmware)?.[1]
  .replace('const bool idle', 'const idle')
  .replace('static_cast<uint32_t>(millis() - transmissionStartedMs)', '((millis() - transmissionStartedMs) >>> 0)');
assert.ok(serviceBody);
for (const scenario of [
  { ready: false, active: true, idle: false, elapsed: 3000, polls: 0, timeout: undefined },
  { ready: true, active: false, idle: false, elapsed: 3000, polls: 0, timeout: undefined },
  { ready: true, active: true, idle: false, elapsed: 1999, polls: 1, timeout: undefined },
  { ready: true, active: true, idle: false, elapsed: 2000, polls: 1, timeout: true },
  { ready: true, active: true, idle: true, elapsed: 100, polls: 1, timeout: false },
  { ready: true, active: true, idle: true, elapsed: 2500, polls: 1, timeout: false },
]) {
  let polls = 0;
  const finishes = [];
  const context = {
    radioState: scenario.ready ? 'ready' : 'chip_not_detected', radioTransmitting: scenario.active,
    transmissionStartedMs: 1000, millis: () => 1000 + scenario.elapsed,
    strcmp: (first, second) => first === second ? 0 : 1,
    LoRa: { beginPacket: () => { polls += 1; return scenario.idle ? 1 : 0; }, idle: () => {} },
    radioDiagnostics: { finished: timeout => { finishes.push(timeout); } },
  };
  vm.runInNewContext(`(() => { ${serviceBody} })()`, context);
  assert.equal(polls, scenario.polls);
  assert.deepEqual(finishes, scenario.timeout === undefined ? [] : [scenario.timeout]);
  assert.equal(context.radioTransmitting, scenario.timeout === undefined ? scenario.active : false);
}
assert.match(firmware, /if \(length <= 0\) return false;\s*radioDiagnostics.parsed/);
assert.match(firmware, /if \(strcmp\(radioState, "ready"\) != 0\) return false;\s*const int length = LoRa.parsePacket/);
const receiveBody = /bool receiveRadio\(Observation &observation\) \{([\s\S]*?)\n\}/.exec(firmware)?.[1];
assert.ok(receiveBody);
const acceptance = receiveBody.slice(receiveBody.indexOf('if (!validObservation(candidate))'))
  .replace('const int64_t ageMs', 'const ageMs')
  .replaceAll('RadioReject::', 'RadioReject.')
  .replaceAll('static_cast<int64_t>(now.tv_sec)', 'now.tv_sec')
  .replace('static_cast<uint32_t>(ageMs > 0 ? ageMs : 0)', 'Math.max(ageMs, 0)');
const epoch = Date.parse('2026-10-26T00:00:10.000Z');
for (const scenario of [
  { valid: false, clock: true, age: 0, replay: false, accept: true, expected: 'InvalidFix' },
  { valid: true, clock: false, age: 0, replay: false, accept: true, expected: 'Clock' },
  { valid: true, clock: true, age: 15000, replay: false, accept: true, expected: 'Stale' },
  { valid: true, clock: true, age: -5001, replay: false, accept: true, expected: 'Stale' },
  { valid: true, clock: true, age: 0, replay: true, accept: true, expected: 'Replay' },
  { valid: true, clock: true, age: 0, replay: false, accept: false, expected: 'Stale' },
  { valid: true, clock: true, age: 1000, replay: false, accept: true, expected: undefined },
]) {
  const rejected = [];
  const candidate = { observedAt: new Date(epoch - scenario.age).toISOString(), receivedAtMs: 10000 };
  const context = {
    candidate, observation: {}, slot: 0, now: { tv_sec: scenario.clock ? epoch / 1000 : 0, tv_usec: 0 },
    millis: () => 10000, validObservation: () => scenario.valid,
    timestampMilliseconds: value => Date.parse(value), acceptableAge: age => age >= -5000 && age < 15000,
    newerThan: () => !scenario.replay,
    radioSources: { lastTimestamp: ['', ''], accept: () => scenario.accept },
    RadioReject: { InvalidFix: 'InvalidFix', Clock: 'Clock', Stale: 'Stale', Replay: 'Replay' },
    radioDiagnostics: { rejected, reject: reason => { rejected.push(reason); return false; }, rxAccepted: [0, 0] },
    addCounter: () => {},
  };
  assert.equal(vm.runInNewContext(`(() => { ${acceptance} })()`, context), scenario.expected === undefined);
  assert.deepEqual(rejected, scenario.expected === undefined ? [] : [scenario.expected]);
  if (scenario.expected === undefined) assert.equal(candidate.receivedAtMs, 9000);
}
console.log('PASS four master startup cases, six actual TX-service and seven RX acceptance-tail branches, failure/reject wiring, guarded activity and safe fields; hardware/SPI/crypto mocked or statically inspected');
