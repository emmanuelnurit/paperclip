---
title: Thelia Event Listener
description: Listening to Thelia core events with full transaction safety.
---

# Thelia Event Listener

Register listeners via `Config/config.xml`:

```xml
<service id="my.listener" class="MyModule\EventListeners\OrderListener">
    <tag name="kernel.event_listener" event="thelia.order.after_create" method="onOrderCreated" />
</service>
```

Best practices:
- Idempotent listeners. Use a dedupe key when triggering external systems.
- Avoid heavy synchronous work — dispatch a Symfony Messenger message instead.
- Catch and log exceptions; never let a listener fail-cascade the whole request.
- Use `OrderEvent::getOrder()` then re-fetch by ID if you need the fresh state.
