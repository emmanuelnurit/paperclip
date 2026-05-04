---
title: Thelia Loop
description: Implementing a Thelia loop for templates.
---

# Thelia Loop

A loop reads data and exposes it to Smarty / TheliaTwig templates. Implement
`PropelSearchLoopInterface` for Propel-backed loops, or `BaseLoop` directly for
custom data sources.

Key methods:
- `getArgDefinitions()`: declare template arguments (`{loop type="my" id="1"}`).
- `buildModelCriteria()`: build a Propel query.
- `parseResults()`: map model rows into `LoopResultRow`.

Best practices:
- Limit results by default to avoid runaway queries.
- Expose only the fields the templates actually consume.
- Avoid hidden N+1 — eager-load joined tables in the criteria.
- For analytics, drop to plain DBAL queries, not loops.
