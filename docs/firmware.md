# Arduino ESP32-C3 firmware

Implementation prepared October 3, 2026. Arduino CLI/toolchain is not installed here and was deliberately not installed today. No ESP32 build, flash, wiring, GPS acquisition, radio transmission, TLS handshake, server integration, or power measurement is verified by the host checks. Sunday October 4 is the device bring-up opportunity; Monday October 5 requires live prototype GPS and server-reported polygon violation/return.

The explicit firmware task confirms Round 2 behavior after the root design and Round 1 ADRs were written. Their statements that cadence/lifecycle/access details remain pending are historical, not a reason to silently implement different behavior. The corrected shared contract requires canonical millisecond UTC timestamps, IDs matching `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`, at most 5 seconds future skew, and stale reporting if either observation age or receipt age reaches 15 seconds. Firmware uses these corrected requirements. This document describes the requested implementation, not a new accepted ADR or a hardware certification.

## Roles and shared code

| Sketch | Actual responsibility |
| --- | --- |
| `glance-prototype/glance-prototype.ino` | NEO6M GPS UART parsing and Wi-Fi HTTP(S) upload; no radio initialization. |
| `glance-slave/glance-slave.ino` | GPS UART parsing and authenticated raw SX1276 transmission; no Wi-Fi initialization. |
| `glance-master/glance-master.ino` | Authenticated radio reception and Wi-Fi forwarding; no GPS UART initialization. |

`libraries/GlanceFirmware` owns the shared GPS, JSON, network, and radio implementation. Arduino resolves its public header via `--libraries ./libraries`, not fragile parent-directory includes from generated sketch build folders. Library compilation includes the dependencies for all roles, although each sketch initializes only its own peripherals. No firmware role evaluates fences, generates incidents, or fabricates location, battery, buzzer, or disconnection events.

## Configure locally before powering modules

From the repository root, copy only the configuration for the role you are provisioning:

```powershell
Copy-Item glance-prototype/config.example.h glance-prototype/config.local.h
Copy-Item glance-slave/config.example.h glance-slave/config.local.h
Copy-Item glance-master/config.example.h glance-master/config.local.h
```

Each role ignores its own `config.local.h`. Never put real credentials in the checked-in example or logs. With no local configuration the examples compile but runtime readiness fails: verification flags are false, pins are `-1`, radio frequency is zero, and network credentials are empty. Set verification flags only after the physical checks below. GPIO range checks cannot certify board routing, reserved pins, supply voltage, or legality.

### GPS settings

- `deviceId`: configured server identity matching `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` (1–64 ASCII characters, first alphanumeric). Prototype example is `prototype-001`; slave example is `slave-01`. Provision the same source identity on the server and receiving master.
- `gpsConfig.rxPin`: MCU UART RX GPIO, connected to GPS **TX**. No pin mapping is assumed.
- `gpsConfig.txPin`: MCU UART TX GPIO, connected to GPS **RX** only if required and verified; `-1` means do not attach a GPS RX wire. ESP32 UART RX-only configuration still requires checking the core/board's unused default TX behavior and keeping that physical wire disconnected.
- `gpsConfig.baud`: `9600` is an editable bring-up starting point, not a measurement of the purchased module's configuration.
- `gpsConfig.wiringVerified`: enable only after board, power, UART voltage/direction, and common-ground checks pass.

The parser consumes complete, checksum-valid RMC sentences containing an active fix, nonempty valid coordinates, UTC date, and UTC time from the **same sentence**. A new TinyGPSPlus parser per RMC prevents stale GGA/date/time fields from being mixed into a new fix. Unknown/inactive/malformed sentences, out-of-range coordinates, invalid dates, duplicate/older UTC observations, and leap-second values are rejected. Wire UTC is canonical `YYYY-MM-DDTHH:mm:ss.sssZ`, using TinyGPSPlus GPS centiseconds multiplied by 10 (not invented millisecond accuracy); `.000Z` is valid. The portable validator accepts valid four-digit calendar years; actual NEO6M/TinyGPSPlus date interpretation and clock sanity require bring-up checks. The GPS module supplies the observation timestamp; Wi-Fi arrival time is never substituted. At most one fresh observation is selected every 5 seconds. No-fix periods generate no uploads; the server retains its last-known location and becomes stale after 15 seconds. GPS also provides the prototype's TLS clock; this is not a claim that GPS timestamps are tamper-proof.

### Uplink settings

- `ssid`, `password`: actual verified bench network. An empty SSID disables startup; an open network can have an empty password.
- `url`: full endpoint, such as `https://your-verified-host.example/api/locations`. No URL credentials, redirects, or CR/LF are accepted.
- `deviceToken`: provision the server's upload-only DEVICE_TOKEN, at least 32 characters, with no CR/LF. Do not install the owner/app credential on firmware. Both prototype and master use upload-only credentials; the slave needs only its radio link key.
- `rootCa`: for HTTPS, the trusted root CA PEM for the deployment's certificate chain, stored as a C++ raw string. Get it from the actual CA/operator, not an unverified guessed certificate. Hostname/chain/time verification stays enabled. No TLS bypass is present.
- `allowTrustedLanHttp`: false by default. Enable only on an explicitly trusted development LAN, with a literal private IPv4 URL such as `http://192.168.1.50:3000/api/locations`. Only RFC1918 IPv4 hosts are accepted for cleartext; DNS aliases, loopback, and public hosts are intentionally excluded. Tokens are exposed to LAN observers. Public/cloud deployment requires HTTPS.
- `ntpServer`: defaults to `pool.ntp.org`; can be set on the local config to an operational time server. Master reception and HTTPS wait for valid system time (2024 or later). Master has no GPS clock; offline/no-time-sync master delivery is not promised.

Example CA assignment in a local configuration lambda:

```cpp
config.rootCa = R"PEM(-----BEGIN CERTIFICATE-----
PASTE THE ACTUAL TRUSTED CA PEM BODY HERE
-----END CERTIFICATE-----
)PEM";
```

That placeholder is not a certificate. Do not enable a deployment before replacing and verifying it. Flash contains credentials in plaintext; no secure-boot, encrypted flash, remote provisioning, or credential rotation mechanism is claimed.

### Radio settings and hardware gate

Set explicit `sckPin`, `misoPin`, `mosiPin`, `csPin` (NSS), `resetPin`, and `dio0Pin` on both devices. Pins must be valid and unique; slave radio pins cannot overlap its GPS UART pins. Match the exact ESP32-C3 Mini variant and module documentation; reserve flash, strap, USB/debug, and serial-console pins appropriately. Polling reception/asynchronous TX does not install a DIO interrupt, but this configuration still requires verifying and declaring DIO0 wiring. No microSD pins or functionality are introduced.

`frequencyHz` stays zero until the exact SX1276 breakout band, matching antennas, local frequency/channel/power/duty-cycle permission, and both endpoints are confirmed. Proposed 915 MHz is **not** approval or a default. The chip-range check (137–1020 MHz) is not a regulatory or module-band check. `txPowerDbm` is editable between 2 and 17 dBm using PA_BOOST, starting at 2 in the disabled example; verify breakout RF routing and allowed output/EIRP before setting `wiringAndBandVerified`. Never transmit without the matched antenna. Both ends use SF7, 125 kHz bandwidth, coding rate 4/5, 8-symbol preamble, explicit headers, sync word `0x47`, and payload CRC. Change modem settings only together and after testing.

`keyHex` is a locally generated random 32-byte radio-link secret represented by 64 hex characters. Empty, malformed, and all-zero keys disable startup. The same link key and `sourceDeviceId` are provisioned on the slave and master. Generate a new private value locally, for example:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

This is the radio authentication key, not a third API/account credential, and must not be posted into logs or source control. Shared-key possession permits creating that slave's radio messages; protect both devices. Only one configured source is supported. Do not claim five-node thesis reliability, pairing, discovery, or LoRaWAN behavior.

Before modules are powered: identify actual board revisions and voltage limits, check rails/polarity/common ground with power removed, confirm GPS VCC is a power rail (not a GPIO), verify GPIO-level compatibility and UART directions, verify USB power and RF antenna, then record the final pin map. Use `docs/research/hardware-review.md`; battery/solar remains deferred. A 1000mAh inventory label does not validate charging, wiring, weight, endurance, or animal deployment.

## Integration contract and bounded failure behavior

The only HTTP body is exactly these four fields:

```json
{"deviceId":"prototype-001","latitude":14.5995,"longitude":120.9842,"observedAt":"2026-10-04T03:04:05.000Z"}
```

`POST /api/locations`, `Content-Type: application/json`, and `Authorization: Bearer DEVICE_TOKEN`. Server response is `200 {"accepted":boolean,"revision":number}`. HTTP 200, including a server-rejected duplicate/outdated observation (`accepted:false`), retires the local attempt; firmware does not need a revision or read access. Other statuses retry only while fresh. The timestamp and device identity are forwarded unmodified. The example above is illustrative, not a live GPS observation or end-to-end evidence.

GPS/radio polling remains in the Arduino loop, while one FreeRTOS task owns networking on the single-core C3. There is no busy wait for Wi-Fi/time synchronization. Network connection retry cadence is 10 seconds; upload retry cadence is 5 seconds; HTTP connect/read timeouts are 2 seconds and TLS handshake timeout is 3 seconds. These bound individual operations, not a hard realtime guarantee or sum-total POST deadline. The network task delays/yields so the foreground can drain the 2048-byte GPS UART buffer and poll the radio. There is one overwrite queue plus one in-flight/latest pending observation, not an unbounded GPS trail. New observations replace pending old ones; data beyond 15 seconds is not retried. Main polling drains at most 1024 UART bytes per pass; NMEA lines are capped at 127 characters. Saturation, UART overflow, RF loss, resets, and outage can drop observations; no disk persistence or guaranteed delivery is implied.

Radio frames are at most 233 bytes: byte `0x01`, 1–200 exact UTF-8 JSON bytes, then a 32-byte raw HMAC-SHA256 tag. The MAC input is ASCII `GLANCE-LORA-V1` (no NUL), followed by the version byte and those exact JSON bytes. Authentication uses ESP32's native mbedTLS HMAC and constant-time full-tag comparison, before bounded JSON parsing. CRC protects accidental corruption; HMAC provides authentication, **not encryption**. Positions/identity/timestamps are visible over RF. Version, size, exact field set/types, identity, coordinate bounds, date, and monotonic UTC are checked before forwarding.

Master additionally rejects timestamps 15 seconds or more behind its synchronized clock, or more than 5 seconds ahead, at millisecond precision, and carries remaining observation age into queue expiry. Upload and pending-queue expiry independently check both monotonic local receipt age and actual GPS UTC age; a delayed observation cannot become fresh by entering or leaving a queue. Radio high-water timestamps are RAM-only and reset on reboot; authenticated replay within the small clock window may be forwarded after a restart, but the server's persistent observation deduplication remains authoritative. Replay outside that window is rejected. NTP/physical GPS trust and time-skew calibration require bench testing.

Radio TX is asynchronous; the slave services its completion/2-second abort guard every foreground loop even when GPS has no fix. There are no ACKs/retries, collision avoidance, multi-node queue, or duty-cycle scheduler. Five-second cadence must itself be checked against local RF rules and airtime; do not set the band-verification flag if unlawful. Collisions/interference/receiver downtime lose messages. The server alone decides initial-outside violation, boundary-inside, repeated-outside deduplication, return resolution, and fence-change closure; radio/network absence never invents a return.

## Sunday setup, compile, flash, and evidence

Do not execute installation or flashing until the requested Sunday setup. After Arduino CLI is installed by the user, from `D:/glance`:

```powershell
arduino-cli config init
arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install esp32:esp32@3.3.2
arduino-cli lib install "TinyGPSPlus@1.1.0" "ArduinoJson@7.4.2" "LoRa@0.8.0"
arduino-cli board list
arduino-cli board details --fqbn esp32:esp32:esp32c3
arduino-cli compile --fqbn esp32:esp32:esp32c3 --libraries ./libraries ./glance-prototype
arduino-cli compile --fqbn esp32:esp32:esp32c3 --libraries ./libraries ./glance-slave
arduino-cli compile --fqbn esp32:esp32:esp32c3 --libraries ./libraries ./glance-master
```

The generic `esp32:esp32:esp32c3` target is an API/build starting point, not a verified selection for the actual Mini board. Confirm board options, flash size/mode, USB CDC/console, bootloader procedure, and physical model; replace the FQBN/options if required. Check each compile exit code before the next step. Compilation with unconfigured examples proves syntax only, not readiness.

Only after the assigned device/port is confirmed available, substitute its actual port (never assume `COM3`):

```powershell
$port = 'REPLACE_WITH_CONFIRMED_COM_PORT'
arduino-cli upload --fqbn esp32:esp32:esp32c3 --port $port --input-dir ./build/prototype ./glance-prototype
```

For that upload command, first compile with `--output-dir ./build/prototype` appended to the prototype compile command. Use distinct output directories/physical ports for slave/master. Alternatively perform `arduino-cli compile --upload --port $port --fqbn esp32:esp32:esp32c3 --libraries ./libraries ./glance-prototype`. Do not run monitor/flashing/device interaction without confirming the shared device is available. For confirmed serial console use `arduino-cli monitor --port $port --config baudrate=115200`.

Collect Sunday evidence: all three compile logs; actual board/pin/rail/antenna measurements; prototype outdoor live valid fix to server/app timestamp; valid HTTPS hostname/CA and wrong-CA rejection; explicitly opted-in LAN HTTP success and public HTTP rejection; absent GPS/inactive RMC/bad checksum causing no fresh reports; Wi-Fi outage/recovery retaining last location and stale state; initial-outside/return flow observed at server/app; one authenticated slave→master→server observation preserving ID/UTC; wrong key, altered payload, wrong ID, duplicate/older/stale/future packet rejection; clock sync loss; RF receiver loss; burst power/reset behavior. Label injected frames/positions as synthetic supplemental evidence. No browser/emulator/device UI is required for the host checks below.

## Host check and upstream API review

```powershell
g++ -std=c++17 -Wall -Wextra -Werror -pedantic -I libraries/GlanceFirmware/src tools/firmware/protocol-check.cpp -o tools/firmware/protocol-check.exe
./tools/firmware/protocol-check.exe
git diff --check -- glance-prototype glance-slave glance-master libraries tools/firmware docs/firmware.md
```

The host check exercises the **actual shared portable helpers** for RMC field completeness (not checksum verification), finite coordinates, ID/date/UTC validation (including leap years), epoch conversion, monotonic deduplication, 15-second expiry/millis wrap, frame bounds/version, and full-tag equality. Its RMC fixtures use a placeholder checksum and are only field-validation inputs, never fake live fixes. It does not execute mbedTLS HMAC, TinyGPSPlus, HTTPClient, FreeRTOS, Arduino compilation, GPIO, or RF. It is deliberately not simulated compile proof. The generated host executable is ignored in its own scope.

Reviewed official upstream APIs before implementation (not an installed-toolchain check):

- [Arduino-ESP32 3.3.2 HTTPClient header](https://github.com/espressif/arduino-esp32/blob/3.3.2/libraries/HTTPClient/src/HTTPClient.h): client-reference `begin`, timeouts, POST, redirects.
- [3.3.2 NetworkClientSecure](https://github.com/espressif/arduino-esp32/blob/3.3.2/libraries/NetworkClientSecure/src/NetworkClientSecure.h): CA and handshake timeout.
- [3.3.2 HardwareSerial](https://github.com/espressif/arduino-esp32/blob/3.3.2/cores/esp32/HardwareSerial.h), [SPI](https://github.com/espressif/arduino-esp32/blob/3.3.2/libraries/SPI/src/SPI.cpp), [WiFiSTA](https://github.com/espressif/arduino-esp32/blob/3.3.2/libraries/WiFi/src/WiFiSTA.h): buffer/UART configuration, explicit SPI pins, nonblocking connection initiation.
- [TinyGPSPlus upstream source](https://github.com/mikalhart/TinyGPSPlus/blob/master/src/TinyGPS%2B%2B.cpp) and [metadata declaring 1.1.0](https://github.com/mikalhart/TinyGPSPlus/blob/master/library.properties): checksum/RMC commits and valid/updated fields. The upstream `v1.1.0` Git tag did not resolve during review; confirm the library manager package version on Sunday rather than invent a pinned source tag.
- [LoRa 0.8.0 header](https://github.com/sandeepmistry/arduino-LoRa/blob/0.8.0/src/LoRa.h) and [source](https://github.com/sandeepmistry/arduino-LoRa/blob/0.8.0/src/LoRa.cpp): explicit pins/frequency, modem settings/CRC, asynchronous TX, polling receive.
- [ArduinoJson 7 JsonDocument](https://arduinojson.org/v7/api/jsondocument/) and [7.4.2 package metadata](https://github.com/bblanchon/ArduinoJson/blob/v7.4.2/library.properties): selected current document API/dependency version.

Known deliberate ceilings: one configured slave, best-effort radio, RAM-only latest uplink queue, no background delivery or GPS-noise hysteresis. Add reliability mechanisms only after required bench evidence shows the need; security/validation and honest stale reporting are not deferred. Raw GPS jitter near a fence can cause boundary oscillation; calibrate with actual measurements instead of claiming GPS certainty or silently adding an unaccepted filter.
