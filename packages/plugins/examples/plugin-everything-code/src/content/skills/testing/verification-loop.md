---
title: Verification Loop
description: Checkpoint-based verification before declaring a task done.
---

# Verification Loop

- Tests describe behavior, not implementation. The test name reads as a spec.
- One behavior per test. Failures are localized.
- Fixtures are predictable; no order-dependent magic.
- Flaky tests are bugs. Quarantine then fix; never normalize the flake.
- Coverage is a guide, not a target.
