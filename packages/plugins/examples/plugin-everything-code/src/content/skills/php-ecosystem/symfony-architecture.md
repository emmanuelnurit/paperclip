---
title: Symfony Architecture
description: How to structure a Symfony 7.x app for clarity, testability and long-term maintenance.
---

# Symfony Architecture

## Layering

- **Controller**: HTTP only. Validation, response shaping. Never business logic.
- **Application Service**: orchestrates a use case. Pure-ish; depends on interfaces.
- **Domain**: entities, value objects, domain services. No framework leak.
- **Infrastructure**: Doctrine repositories, Messenger transports, HttpClient adapters.

## Project layout

```
src/
├── Controller/
├── DTO/
├── Application/
│   ├── Command/
│   ├── Query/
│   └── Service/
├── Domain/
│   ├── Entity/
│   ├── ValueObject/
│   └── Repository/         # interfaces
├── Infrastructure/
│   ├── Doctrine/
│   ├── Messenger/
│   └── Http/
└── Security/
```

## Conventions

- Services are `final readonly`. Constructor injection only.
- Routes via `#[Route]` attributes on controllers.
- Use `Symfony\Component\Validator` to validate DTOs at the controller boundary.
- Errors: throw domain exceptions; convert to HTTP via an `ExceptionListener`.
- Configuration: `services.yaml` with autowire + autoconfigure; explicit binds for primitives.
- Profile per env in `config/packages/<env>/`.

## Performance

- Lazy services for hot paths.
- HTTP cache + ESI for high-traffic GET endpoints.
- Doctrine: `partial` hydration where needed; `EXTRA_LAZY` collections for large relations.

## Security

- `security.yaml`: token-based auth (LexikJWT or Symfony AccessToken).
- Voters per resource. Avoid `IS_GRANTED` checks scattered in controllers.
- CSRF for HTML forms only.

## Tests

- **Unit**: fast, no kernel boot.
- **Functional** via `WebTestCase` for routes.
- **Integration** via `KernelTestCase` for services with real container.
