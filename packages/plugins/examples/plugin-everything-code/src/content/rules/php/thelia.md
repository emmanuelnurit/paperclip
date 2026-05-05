---
title: Thelia — additional rules
description: Thelia-specific rules layered on PHP common rules.
---

# Thelia

- Never edit core. Use modules, hooks, and template overrides.
- Listeners and hooks are idempotent and quick — defer heavy work to Messenger.
- Use `MODULE_DOMAIN` for translations exclusively.
- Public assets stay under your module path.
