---
title: Thelia Hook
description: Hook listeners for content injection in front and back office.
---

# Thelia Hook

Hooks let modules render markup at predefined insertion points. Register via
`Config/config.xml` and listen on the corresponding event:

```xml
<service id="my.hook" class="MyModule\Hook\MyHook">
    <tag name="hook.event_listener" event="frontOffice.product.additional"
         method="onProductAdditional" />
</service>
```

Conventions:
- Render with `$this->render('template.html', [...])`. Keep templates lean.
- Wrap markup in module-specific CSS classes.
- Use translations from your `MODULE_DOMAIN`.
- Avoid heavy work inside hook handlers — they run on every request.
