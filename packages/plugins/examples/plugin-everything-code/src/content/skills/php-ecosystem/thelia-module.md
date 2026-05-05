---
title: Thelia Module
description: Architecture and best practices for Thelia 2.x modules.
---

# Thelia Module

Thelia 2.x is a Symfony 6-based e-commerce platform. Modules extend the core via:

- **Loop**: read-side data extraction for templates (Smarty / TheliaTwig).
- **Hook**: rendering insertion points in front and back office.
- **Event listeners**: react to domain events (`OrderEvent`, `CartEvent`).
- **Controller**: custom routes for module-specific UIs.
- **Form**: backoffice configuration forms.
- **Action**: orchestrates use cases triggered by events.
- **Template**: Smarty / TheliaTwig overrides.
- **Schema**: Propel ORM tables under `Config/schema.xml`.

## Layout
```
local/modules/MyModule/
├── MyModule.php
├── Config/
│   ├── module.xml
│   ├── config.xml
│   ├── routing.xml
│   └── schema.xml
├── EventListeners/
├── Loop/
├── Hook/
├── Form/
├── Controller/
├── Action/
├── templates/
└── I18n/
```

## Conventions
- `MODULE_DOMAIN` and `MESSAGE_DOMAIN` constants on the module class.
- All translatable strings via `Translator::getInstance()->trans('Key', [], MESSAGE_DOMAIN)`.
- Public assets under `templates/<frontOffice|backOffice>/default/assets`.
- Composer for dependencies. Stick to libraries already used by Thelia core to avoid version conflicts.
