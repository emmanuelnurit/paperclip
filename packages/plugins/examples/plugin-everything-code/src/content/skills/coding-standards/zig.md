---
title: Zig Coding Standards
description: Zig 0.13+ for systems programming.
---

# Zig Coding Standards

- Use the official formatter and linter in CI.
- Prefer immutability and explicit types at module boundaries.
- Errors at boundaries; do not swallow.
- Tests: official framework, table-driven where natural.
- Avoid speculative abstractions; cut features that are not asked for.
- Document only the WHY of non-obvious code; let names carry the WHAT.
