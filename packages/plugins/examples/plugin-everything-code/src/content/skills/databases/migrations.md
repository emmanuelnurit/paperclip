---
title: Database Migrations
description: Safe migrations on production datastores.
---

# Database Migrations

- Treat schemas as code: versioned migrations, never hand-edit.
- Backups validated by periodic restore drills.
- Indexes are deliberate, measured, and explained.
- Long-running queries time out and degrade gracefully.
- Multi-tenant isolation enforced at the row level (RLS where supported).
