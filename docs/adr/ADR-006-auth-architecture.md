# ADR-006: Authentication & Authorization Architecture

Date: 2025-10-06

## Status
Accepted

## Context
The application requires a robust authentication and authorization mechanism. Backend is IIS-hosted with potential Integrated Windows Authentication (IWA / SSO). We need a secure, UX-friendly flow with short-lived access tokens and refresh tokens held in HttpOnly cookies. Existing Angular scaffold uses standalone APIs, signals, and zoneless change detection.

## Decision
Adopt Option B (Memory Access Token + HttpOnly Refresh Cookie) with the following characteristics:

- Access token stored only in memory (never localStorage/sessionStorage) to reduce XSS exfiltration risk.
- Refresh token managed server-side via secure HttpOnly SameSite cookie.
- Silent session initialization at bootstrap attempting: `/auth/refresh` then fallback `/auth/me` (IIS SSO) then unauth state.
- Proactive refresh scheduled ~45 seconds before expiry.
- `canMatch` guard to block lazy module loading for protected routes (`dashboard`, `clothes`, `theme-demo`).
- Functional HTTP interceptor attaches bearer token and single retry after 401 with refresh.
- Signal-based `AuthStore` centralizes state: status, user, token metadata.
- Permission & role checks via store helpers and a structural directive `hasPermission`.
- Splash component renders while status is `unknown` to avoid flicker.
- Tests added for AuthStore; more planned for guard and interceptor.

## Rationale
- Memory-only access token: minimizes attack surface while retaining SPA responsiveness.
- HttpOnly cookie refresh: fits IIS + potential integrated auth, avoids exposing long-lived credential to JS.
- `canMatch` vs `canActivate`: stops code download earlier, minor performance & security win.
- Signals produce minimal overhead and integrate well with zoneless configuration.
- Proactive refresh reduces token expiry race conditions mid-interaction.

## Alternatives Considered
1. LocalStorage tokens: Rejected due to XSS risk.
2. BFF pattern: Higher security but added server complexity not required at this stage.
3. OIDC library integration: Deferred until/if a central IdP (Azure AD, Auth0) is mandated.

## Security Considerations
- Enforce strong CSP and template sanitization to mitigate XSS.
- Backend must set refresh cookie with: `HttpOnly; Secure; SameSite=Lax/Strict`.
- Implement CSRF mitigation (double-submit or same-site + custom header) for state-changing endpoints if needed.
- Access token TTL should be short (<15 min) to bound replay.
- Refresh rotation recommended on each refresh to prevent token theft usability.

## Testing Strategy
- Unit tests: store, guard, directive, interceptor refresh logic (to be added).
- Integration: mock `/auth/refresh`, `/auth/me`, 401 mid-request replay.
- E2E: expired token scenario, SSO auto-login, manual logout multi-tab (future BroadcastChannel addition).

## Future Enhancements
- BroadcastChannel multi-tab sync.
- WebSocket push for permission revocation.
- Step-up authentication for sensitive routes.
- Fine-grained policy evaluation service (claims → permissions expansion).

## Consequences
- Need robust backend endpoints contract.
- Some complexity in refresh queuing (currently single-flight; extend if advanced queuing needed).

## References
- OWASP SPA Security Best Practices
- Angular functional guards & interceptors (v16+)

