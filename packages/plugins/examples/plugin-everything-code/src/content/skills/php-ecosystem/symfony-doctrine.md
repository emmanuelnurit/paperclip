---
title: Symfony Doctrine
description: Doctrine ORM and DBAL conventions for Symfony 7.x projects.
---

# Symfony Doctrine

## Mapping

- Use PHP attributes for mapping. Avoid YAML/XML mapping.
- `Uuid v7` ids generated client-side via `Symfony\Component\Uid\Uuid`.
- `DateTimeImmutable` columns via `datetimetz_immutable` or `datetime_immutable`.
- `enum` columns via backed PHP enums + `enumType: ...`.

## Entities

- Constructor establishes invariants. No setters for invariants — use rich domain methods.
- Relationships: prefer `OneToMany` with `EXTRA_LAZY` collections for unbounded relations.
- Keep entities free of framework dependencies (no Symfony Validator on entities — validate DTOs instead).

## Repositories

- Extend `ServiceEntityRepository`. Type the generic: `@extends ServiceEntityRepository<MyEntity>`.
- Provide intention-revealing finder methods: `findActiveCustomers()` not `findBy(['status' => 'active'])`.
- Avoid leaking QueryBuilder into the domain layer.

## Migrations

- One migration per logical change. Up + Down both implemented.
- Avoid renaming columns without a two-step migration in production.
- Run with `--all-or-nothing` in production where supported.

## Performance

- `EXPLAIN` slow queries; add covering indexes.
- Use `partial` hydration for read-only views.
- Beware the N+1 — eager-load with `addSelect` joined fetch.

## DBAL

- Drop to DBAL for analytical queries. Always parameterize.
- Use `Connection::transactional` for multi-statement work.
