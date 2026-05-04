---
title: Autonomous Loop
description: Sequential pipelines and PR loops with safe stop conditions.
---

# Autonomous Loop

- Each agent has a clearly bounded objective and exit criteria.
- Coordinator merges results; agents do not auto-merge their own.
- Idempotent steps so retries are safe.
- Observable: every spawn / wake / completion logged with correlation IDs.
- Hard budget per loop. Stop on diminishing returns or critical errors.
