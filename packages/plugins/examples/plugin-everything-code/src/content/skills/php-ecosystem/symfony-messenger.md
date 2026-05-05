---
title: Symfony Messenger
description: Async commands, events and queues with Symfony Messenger.
---

# Symfony Messenger

- One bus per intent: `command.bus`, `query.bus`, `event.bus`.
- Transports: AMQP for production, Doctrine for transactional outbox, sync for tests.
- Idempotent handlers. Use a dedupe key in the message envelope.
- Failure transport with structured retry (`max_retries`, `multiplier`).
- Stamps: `BusNameStamp`, `DelayStamp`, custom correlation IDs.
- Schedule via the Scheduler component instead of cron when possible.
