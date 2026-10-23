#pragma once

#include <NetworkClientSecure.h>
#include <sdkconfig.h>

namespace glance {

inline bool tlsTrustAvailable(const char *rootCa) {
  if (rootCa && rootCa[0] != '\0') return true;
#if CONFIG_MBEDTLS_CERTIFICATE_BUNDLE && (CONFIG_MBEDTLS_CERTIFICATE_BUNDLE_DEFAULT_FULL || CONFIG_MBEDTLS_CERTIFICATE_BUNDLE_DEFAULT_CMN)
  return true;
#else
  return false;
#endif
}

inline bool configureTlsTrust(NetworkClientSecure &client, const char *rootCa) {
  if (rootCa && rootCa[0] != '\0') {
    client.setCACert(rootCa);
    return true;
  }
#if CONFIG_MBEDTLS_CERTIFICATE_BUNDLE && (CONFIG_MBEDTLS_CERTIFICATE_BUNDLE_DEFAULT_FULL || CONFIG_MBEDTLS_CERTIFICATE_BUNDLE_DEFAULT_CMN)
  client.useBuiltinCACertBundle();
  return true;
#else
  return false;
#endif
}

}
