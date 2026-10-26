import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sketch = readFileSync(new URL('../../glance-slave/glance-slave.ino', import.meta.url), 'utf8');
const firmware = readFileSync(new URL('../../libraries/GlanceFirmware/src/GlanceFirmware.cpp', import.meta.url), 'utf8');
assert.match(firmware, /static QueueHandle_t uploadQueues\[sourceSlots\]/);
assert.match(firmware, /xQueueCreate\(1, sizeof\(Observation\)\)/);
assert.match(firmware, /xQueueOverwrite\(uploadQueues\[slot\], &observation\)/);
assert.match(firmware, /pending.store\(incoming, millis\(\),/);
assert.match(firmware, /sourceIndex\(observation.deviceId, uplinkConfig.deviceId, uplinkConfig.secondDeviceId\)/);
assert.match(firmware, /radioSources.accept\(candidate, millis\(\)/);
assert.ok(!firmware.includes('lastRadioTimestamp'));
const gpsExpression = /\n\s+gpsReady = ([\s\S]+?);/.exec(sketch)?.[1].replaceAll('glance::', 'glance.');
const radioExpression = /\n\s+radioReady = ([\s\S]+?);/.exec(sketch)?.[1].replaceAll('glance::', 'glance.');
assert.ok(gpsExpression && radioExpression);

for (const scenario of [
  { identity: true, matchingId: true, disjoint: true, gps: true, radio: false, expectedGps: true, expectedRadioCalls: 1 },
  { identity: true, matchingId: true, disjoint: true, gps: true, radio: true, expectedGps: true, expectedRadioCalls: 1 },
  { identity: false, matchingId: true, disjoint: true, gps: true, radio: true, expectedGps: false, expectedRadioCalls: 0 },
  { identity: true, matchingId: false, disjoint: true, gps: true, radio: true, expectedGps: false, expectedRadioCalls: 0 },
  { identity: true, matchingId: true, disjoint: false, gps: true, radio: true, expectedGps: false, expectedRadioCalls: 0 },
  { identity: true, matchingId: true, disjoint: true, gps: false, radio: true, expectedGps: false, expectedRadioCalls: 0 },
]) {
  let radioCalls = 0;
  const context = {
    deviceId: 'test-tracker', gpsConfig: {}, radioConfig: { sourceDeviceId: 'test-tracker' },
    strcmp: () => scenario.matchingId ? 0 : 1,
    glance: {
      validDeviceId: () => scenario.identity,
      disjointGpsRadioPins: () => scenario.disjoint,
      beginGps: () => scenario.gps,
      beginRadio: () => { radioCalls += 1; return scenario.radio; },
    },
  };
  const gpsReady = vm.runInNewContext(gpsExpression, context);
  const radioReady = vm.runInNewContext(radioExpression, { ...context, gpsReady });
  assert.equal(gpsReady, scenario.expectedGps);
  assert.equal(radioReady, scenario.expectedGps && scenario.radio);
  assert.equal(radioCalls, scenario.expectedRadioCalls);
}

assert.match(sketch, /if \(gpsReady\) \{\s*if \(radioReady\) glance::serviceRadioTransmission\(\);\s*glance::Observation observation;\s*if \(glance::pollGps\(deviceId, observation\)\) \{\s*radioPending.store\(observation, deviceId, radioReady, millis\(\)\);/);
assert.match(sketch, /if \(radioPending.due\(deviceId, gpsReady && radioReady, now\)\) \{\s*Serial.println\(glance::sendRadio\(radioPending.observation\)/);
assert.match(sketch, /GPS observation ready; radio disabled \(not transmitted\)/);
assert.ok(!sketch.includes('beginUplink'));
const radioSetup = firmware.slice(firmware.indexOf('bool beginRadio('), firmware.indexOf('static bool authenticate('));
assert.ok(radioSetup.indexOf('!config.wiringAndBandVerified') < radioSetup.indexOf('SPI.begin('));
assert.ok(radioSetup.indexOf('config.frequencyHz < 137000000') < radioSetup.indexOf('LoRa.begin('));
assert.match(radioSetup, /if \(index == 4 && pins\[index\] == -1\) continue;/);
assert.match(radioSetup, /return initFailed\("Radio", radioState, "pin_invalid"\)/);
assert.match(radioSetup, /return initFailed\("Radio", radioState, "pin_duplicate"\)/);
const validationCpp = /const int pins\[\] = \{[\s\S]+?(?=\s+uint8_t nonzero)/.exec(radioSetup)?.[0];
assert.ok(validationCpp);
const validationJs = validationCpp.replace('const int pins[] = {', 'const pins = [').replace('config.dio0Pin};', 'config.dio0Pin];').replaceAll('size_t ', 'let ');
const basePins = { sckPin: 4, misoPin: 7, mosiPin: 6, csPin: 10, resetPin: 3, dio0Pin: 2 };
for (const scenario of [
  { changes: {}, expected: true },
  { changes: { resetPin: -1 }, expected: true },
  { changes: { resetPin: -2 }, expected: false },
  { changes: { resetPin: 4 }, expected: false },
  { changes: { dio0Pin: -1 }, expected: false },
  { changes: { csPin: -1 }, expected: false },
  { changes: { misoPin: 6 }, expected: false },
  { changes: { resetPin: -1, dio0Pin: 10 }, expected: false },
]) {
  const valid = vm.runInNewContext(`(() => { ${validationJs} return true; })()`, {
    config: { ...basePins, ...scenario.changes },
    radioState: 'not_started',
    initFailed: () => false,
    inputPin: pin => Number.isInteger(pin) && pin >= 0 && pin <= 21,
    outputPin: pin => Number.isInteger(pin) && pin >= 0 && pin <= 21,
  });
  assert.equal(valid, scenario.expected);
}
console.log('PASS six actual startup-expression and eight radio-validation cases, GPS-only polling, guarded radio calls, ID/pin gates and pre-SPI RF gate; target GPIO predicates mocked, no Arduino/device execution');
