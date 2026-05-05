---
title: Symfony TDD
description: Test-driven development workflow tailored to Symfony.
---

# Symfony TDD

1. Start with a `WebTestCase` failing for the new route.
2. Add a controller that returns the correct shape but throws domain-not-implemented for the body.
3. Drive the application service via `KernelTestCase`. Mock repositories where they are interfaces.
4. Drive the domain via pure unit tests.
5. Add Doctrine tests last, against a transactional fixture loader.

Useful patterns:
- `zenstruck/foundry` for fixtures.
- `Symfony\Bundle\FrameworkBundle\Test\KernelTestCase::getContainer()` for DI access.
- `dama/doctrine-test-bundle` to wrap each test in a transaction.
