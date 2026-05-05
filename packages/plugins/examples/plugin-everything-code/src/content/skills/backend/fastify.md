---
title: Fastify
description: Fastify with schema-driven validation.
---

# Fastify

## Conventions
- Strict request validation at the boundary; reject unknown fields.
- Layered architecture: HTTP -> Application -> Domain -> Infrastructure.
- Errors map to HTTP via a single converter; never leak stack traces.
- Idempotent mutations where possible; safe retries.
- Observability: structured logs, traces (OTel), RED metrics.

## Tests
- Unit on logic. Functional on routes. Contract tests against external APIs.

## Performance
- Cache at the right layer: HTTP for unauthenticated GETs, in-memory for hot lookups, datastore for shared.
- Pagination by cursor for large lists.
