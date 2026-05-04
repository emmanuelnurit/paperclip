---
title: Thelia Payment Module
description: Implementing a Thelia 2.x payment module.
---

# Thelia Payment Module

A payment module extends `\Thelia\Module\AbstractPaymentModule`:

```php
final class MyPay extends AbstractPaymentModule
{
    public function pay(Order $order): \Symfony\Component\HttpFoundation\Response
    {
        // build PSP redirect or capture
    }

    public function isValidPayment(): bool
    {
        // availability rules: country, amount range, currency
        return true;
    }
}
```

Conventions:
- Idempotent webhook handler. Verify signature with the PSP secret stored in `secrets:`.
- Store transaction references in `OrderEvent::ATTRIBUTE_KEY` data.
- Move the order state via `OrderManualEvent` or `OrderEvent::ORDER_UPDATE_STATUS`.
- Always log raw PSP payloads with PII redacted.
