---
status: accepted
date: 2026-10-05
---

# Free Render managed-edge transport

The user approved a single **Free Render web service in Singapore**, reusing the existing Glance PostgreSQL 18 database and privately provisioned existing device ID, upload token and owner token unchanged. This resolves the exact-proxy-IP blocker without guessing Render edge addresses.

## Decision

Add explicit `TRANSPORT_MODE=render-edge`. Render's public edge enforces HTTPS redirects and terminates client TLS, then sends HTTP to the service. Free web services cannot receive private-network traffic but can connect outward to the managed database. This documented Free-service ingress restriction is the deployment boundary, not a claim that arbitrary internal HTTP is secure.

Fastify uses `trustProxy:false` in this mode. Forwarded protocol, host and address headers are not security evidence. The exact-IP HTTPS check remains unchanged for `https-proxy`; the Render-specific mode delegates public transport enforcement to the platform. Owner/device authentication, WebSocket first-frame authentication, payload validation, GPS freshness and lifecycle rules remain unchanged. Production still rejects `trusted-local`.

Startup requires `RENDER=true` and `RENDER_SERVICE_TYPE=web`. These platform markers catch accidental configuration; they are not peer authentication or proof of the compute plan. The operator must select **Free** and verify platform settings. Do not use this mode on arbitrary hosts, paid Render services or private services.

Firmware and mobile clients must use certificate-verified **HTTPS/wss** directly. No `setInsecure`, certificate bypass, token-bearing HTTP redirect test or client cleartext exception is authorized for cloud traffic. The Render edge-to-process hop is plaintext HTTP, as with the existing TLS-terminating proxy architecture; the application no longer independently rejects that hop in this mode. Platform ingress isolation and trusted Render infrastructure are explicit assumptions.

## Limits and verification

Reevaluate before changing compute plans or allowing private ingress: paid web services can receive private HTTP from other workspace/region services. Do not silently carry this approval into that boundary. No wildcard proxy trust, private-subnet trust, hop-count guess, additional reverse proxy or third credential is needed for this Free-only demonstration.

Free cold starts and restarts can interrupt uploads and live sockets. Clients reconnect and retrieve snapshots; the 15-second stale rule still applies and must not be disguised to hide cold starts. This is a thesis demonstration, not an uptime guarantee. The existing Free database's reported November 3, 2026 expiration needs an export/retention decision; no paid upgrade or plan/storage change is authorized here.

Before deployment test marker rejection, header irrelevance, unchanged exact-IP rejection, HTTP/WS authorization and the actual Docker image/migrations against disposable PostgreSQL 18. Local simulation cannot prove Render isolation or real hostname certificates. After deployment verify public HTTP redirect without credentials, verified HTTPS owner/device routes and authenticated WSS; synthetic fixtures must not overwrite the live bench state.

## Sources

- [Render Web Services](https://render.com/docs/web-services): public TLS termination, HTTP redirect and internal forwarding.
- [Free restrictions](https://render.com/docs/free) and [Private Network](https://render.com/docs/private-network): no Free-service private ingress, with outbound database access.
- [Environment variables](https://render.com/docs/environment-variables): `RENDER` and `RENDER_SERVICE_TYPE` markers.
- [WebSockets](https://render.com/docs/websocket): public clients use wss; ws handshakes encounter redirects.
