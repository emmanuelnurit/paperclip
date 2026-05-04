---
title: C# Coding Standards
description: Modern C# (12+) with records, primary constructors, nullability.
---

# C# Coding Standards

- Use the official formatter and linter in CI.
- Prefer immutability and explicit types at module boundaries.
- Errors at boundaries; do not swallow.
- Tests: official framework, table-driven where natural.
- Avoid speculative abstractions; cut features that are not asked for.
- Document only the WHY of non-obvious code; let names carry the WHAT.
