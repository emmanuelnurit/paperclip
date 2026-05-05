---
title: SvelteKit
description: SvelteKit with Svelte 5 runes.
---

# SvelteKit

## Conventions
- Component files small and focused; one component per file.
- Co-locate types, styles and tests with the component.
- Server-rendered by default when the framework supports it; opt-in to client.
- Treat data fetching as a first-class concern; cache deliberately.
- Accessibility from day one (semantic HTML, focus order, aria-* only when needed).

## Anti-patterns
- Global state for what should be URL state.
- Massive context providers; prefer co-located stores.
- Inline styles for repeated patterns; use design tokens.

## Tests
- Unit tests on logic. Component tests via the framework's recommended runner.
- Visual regression only on stable critical surfaces.
