---
title: Rust Coding Standards
description: Idiomatic Rust for libraries and async services.
---

# Rust Coding Standards

- `clippy::all` + `clippy::pedantic` (selectively). `rustfmt`.
- Avoid `unwrap`/`expect` in libraries. Use `?` with `thiserror` errors at module boundaries; `anyhow` only in binaries.
- Prefer `&str` parameters; expose `String` only when ownership is needed.
- Async: `tokio` with structured concurrency (`JoinSet`, `select!`).
- Lifetimes: name them when they aid the reader; never elide-then-comment.
- Tests: `#[cfg(test)]` + `proptest` for invariants.
- Avoid `unsafe` unless documented and audited.
