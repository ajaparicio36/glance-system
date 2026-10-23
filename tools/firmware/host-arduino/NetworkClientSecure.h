#pragma once

class NetworkClientSecure {
public:
  const char *rootCa = nullptr;
  bool builtinBundle = false;

  void setCACert(const char *value) { rootCa = value; }
  void useBuiltinCACertBundle() { builtinBundle = true; }
};
