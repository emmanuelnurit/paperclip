---
title: Thelia Template Override
description: How to override Thelia templates without touching core.
---

# Thelia Template Override

1. Copy the template into `local/modules/<MyModule>/templates/<scope>/default/<file>`.
2. Declare the template directory in your module config.
3. Use Smarty / TheliaTwig blocks. Extend, don't replace.

```smarty
{extends file="parent.html"}
{block name="content"}
    {hook name="my.hook.before"}
    {$smarty.block.parent}
    {hook name="my.hook.after"}
{/block}
```

Tips:
- Never edit `templates/frontOffice/default` in core.
- Keep custom assets under your module to avoid global CSS leaks.
- Use module-specific JS namespaces.
