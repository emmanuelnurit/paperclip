---
title: PHP Coding Standards
description: Modern PHP (8.3+) with strict types, attributes, readonly, and PSR conventions.
---

# PHP Coding Standards

## Baseline

- `declare(strict_types=1);` on every file.
- PSR-12 / PER-CS coding style. PHP-CS-Fixer in CI.
- PHPStan level max (`max` not `9`). Justify every `@phpstan-ignore` with a comment.

## Types

- Typed properties everywhere. `readonly` for value objects.
- Enums for closed sets. Backed enums for persisted values.
- Avoid `mixed` and `array`; prefer typed collections (Doctrine Collection, custom value objects).

## OOP

- Final by default. Make a class non-final only when subclassing is part of the contract.
- Constructor property promotion. No setters unless mutation is intentional.
- Dependency injection through the constructor; no service locator.

## Error handling

- Domain exceptions extending a small `DomainException` hierarchy.
- Never swallow exceptions silently. Log with context at the boundary.

## Testing

- PHPUnit or Pest. One behavior per test. AAA structure.
- Avoid mocking what you don't own — wrap third-party libs in adapters and mock those.

## Tooling

- `composer.json`: pinned constraints in libs, range constraints in apps.
- `composer audit` in CI.
- Rector for PHP version upgrades. PHP CS Fixer for style.
