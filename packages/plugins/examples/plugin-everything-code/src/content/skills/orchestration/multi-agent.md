---
title: Multi-Agent Orchestration
description: Fan-out planning and execution across agents.
---

# Multi-Agent Orchestration

- Each agent has a clearly bounded objective and exit criteria.
- Coordinator merges results; agents do not auto-merge their own.
- Idempotent steps so retries are safe.
- Observable: every spawn / wake / completion logged with correlation IDs.
- Hard budget per loop. Stop on diminishing returns or critical errors.
