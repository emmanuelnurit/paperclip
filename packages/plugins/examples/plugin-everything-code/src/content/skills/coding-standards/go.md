---
title: Go Coding Standards
description: Idiomatic Go for services and CLIs.
---

# Go Coding Standards

- `go vet`, `staticcheck`, `golangci-lint` in CI.
- Errors: wrap with `%w`, never compare with `==`. Sentinel errors for known cases.
- Context is the first parameter. Never store a context in a struct.
- Goroutines own their lifecycle. Always handle the cleanup case.
- Tests: table-driven, `t.Run` for subtests. `testify/require` only when assertions deserve it.
- Avoid premature interfaces. Define them where they're consumed.
- No global mutable state. Inject configuration through struct fields.
