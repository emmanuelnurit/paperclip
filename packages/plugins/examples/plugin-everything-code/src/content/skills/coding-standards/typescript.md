---
title: TypeScript Coding Standards
description: Strict, modern TypeScript that scales — from Node services to React UIs.
---

# TypeScript Coding Standards

## Compiler

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- Prefer `unknown` over `any`. Justify each `any` with a short comment.
- Module: `NodeNext` for libraries; `bundler` only when bundlers actually own resolution.

## API design

- Public exports get explicit types. No leaky inferred types across module boundaries.
- Discriminated unions for state machines. `never` for exhaustiveness.
- Avoid optional bag-of-flags parameters; prefer narrow constructors and small helpers.

## Errors

- Throw `Error` subclasses, never strings. Include actionable context.
- Don't catch unless you handle. Don't swallow with `// ignored` unless you log a reason.
- For async APIs: never return a rejected promise from a synchronous-looking function.

## Async

- No floating promises. Either `await`, return, or `void`.
- AbortController for cancellation. Pass `signal` through every public async API.

## Tests

- Vitest for libraries, Playwright for browser e2e. One assertion per intent.
- Tables for parametric tests. Avoid snapshot tests for logic.

## Lint

- `@typescript-eslint/recommended-type-checked` + `eslint-config-prettier`.
- Forbid `console.log` in committed code.
