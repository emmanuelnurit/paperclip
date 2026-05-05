---
title: Java Coding Standards
description: Modern Java (21+) with records, sealed types, and pattern matching.
---

# Java Coding Standards

- `record` for immutable data carriers. `sealed` hierarchies for closed type families.
- Pattern matching for `switch` and `instanceof`.
- `Optional` for return types only; never as fields or parameters.
- Streams for transformations, not for side effects.
- Tests: JUnit 5 + AssertJ. AssumeFalse over disabled tests.
- Build: Gradle Kotlin DSL preferred; Maven if mandated.
- Errors: prefer unchecked exceptions for programmer errors; checked only at module boundaries.
