---
title: Symfony — additional rules
description: Symfony-specific rules layered on PHP common rules.
---

# Symfony

- Controllers stay HTTP-only.
- Domain layer never imports `Symfony\Bundle\*`.
- Use the Validator at the boundary; do not duplicate constraints in lower layers.
- Voters for fine-grained authorization; roles only for coarse capability gates.
