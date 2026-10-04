#pragma once

#include <cstdint>
#include <climits>
#include <cmath>

using byte = uint8_t;
unsigned long millis();
constexpr double TWO_PI = 6.28318530717958647692;
inline double radians(double angle) { return angle * TWO_PI / 360; }
inline double degrees(double angle) { return angle * 360 / TWO_PI; }
inline double sq(double value) { return value * value; }
