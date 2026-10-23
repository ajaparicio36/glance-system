#include "GlanceTls.h"
#include <cassert>
#include <iostream>

int main() {
#if CONFIG_MBEDTLS_CERTIFICATE_BUNDLE && (CONFIG_MBEDTLS_CERTIFICATE_BUNDLE_DEFAULT_FULL || CONFIG_MBEDTLS_CERTIFICATE_BUNDLE_DEFAULT_CMN)
  constexpr bool builtinAvailable = true;
#else
  constexpr bool builtinAvailable = false;
#endif
  assert(glance::tlsTrustAvailable("") == builtinAvailable);
  assert(glance::tlsTrustAvailable(nullptr) == builtinAvailable);
  NetworkClientSecure defaultClient;
  assert(glance::configureTlsTrust(defaultClient, "") == builtinAvailable);
  assert(defaultClient.builtinBundle == builtinAvailable);
  assert(defaultClient.rootCa == nullptr);
  NetworkClientSecure nullClient;
  assert(glance::configureTlsTrust(nullClient, nullptr) == builtinAvailable);
  assert(nullClient.builtinBundle == builtinAvailable);
  const char explicitRoot[] = "explicit custom root";
  assert(glance::tlsTrustAvailable(explicitRoot));
  NetworkClientSecure overrideClient;
  assert(glance::configureTlsTrust(overrideClient, explicitRoot));
  assert(overrideClient.rootCa == explicitRoot);
  assert(!overrideClient.builtinBundle);
  const char invalidRoot[] = "not a certificate";
  NetworkClientSecure invalidClient;
  assert(glance::configureTlsTrust(invalidClient, invalidRoot));
  assert(invalidClient.rootCa == invalidRoot);
  assert(!invalidClient.builtinBundle);
  std::cout << "TLS trust selection passed; bundle=" << builtinAvailable
            << "; explicit/invalid roots never fall back to bundle; real TLS validation is platform-owned\n";
}
