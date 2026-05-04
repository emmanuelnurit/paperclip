---
title: Symfony Security
description: Authentication, authorization, voters and JWT in Symfony 7.x.
---

# Symfony Security

## Authentication
- New auth manager (`security.yaml` with `enable_authenticator_manager: true` is default in 7.x).
- Stateless JSON APIs: AccessToken authenticator + LexikJWT.
- Stateful HTML: form login + remember-me.

## Authorization
- Voters per resource. Return `ACCESS_GRANTED` / `ACCESS_DENIED` / `ACCESS_ABSTAIN`.
- Roles describe coarse capability; voters describe fine-grained access.
- Avoid `is_granted('ROLE_X')` outside the security layer.

## Hardening
- HTTPS-only sessions, `cookie_secure: auto`, `cookie_samesite: lax` minimum.
- Argon2id password hashing (default in modern Symfony).
- Rate-limit auth endpoints with the RateLimiter component.
