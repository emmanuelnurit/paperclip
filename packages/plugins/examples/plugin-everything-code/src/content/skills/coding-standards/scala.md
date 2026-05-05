---
title: Scala Coding Standards
description: Modern Scala 3 with effect systems (cats-effect or ZIO).
---

# Scala Coding Standards

- Use the official formatter and linter in CI.
- Prefer immutability and explicit types at module boundaries.
- Errors at boundaries; do not swallow.
- Tests: official framework, table-driven where natural.
- Avoid speculative abstractions; cut features that are not asked for.
- Document only the WHY of non-obvious code; let names carry the WHAT.
