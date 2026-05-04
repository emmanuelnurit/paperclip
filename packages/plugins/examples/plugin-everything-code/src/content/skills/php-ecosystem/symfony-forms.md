---
title: Symfony Forms
description: Symfony Form component for HTML and API DTOs.
---

# Symfony Forms

- Use `FormType` classes. Bind to `data_class` for entities; bind to `null` for free-form DTOs and use `getData()`.
- Validation via constraint attributes on the bound class. Don't duplicate constraints in multiple layers.
- Use `Symfony\Component\Validator` for JSON APIs too — call `$validator->validate($dto)`.
- For multistep forms prefer separate types and explicit transitions.
- CSRF: enabled by default for HTML; disable explicitly for stateless JSON.
- Theming via `form_theme` blocks; never inline complex template logic.
