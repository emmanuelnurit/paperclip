---
title: Composer Best Practices
description: Composer for libraries and apps in 2026.
---

# Composer Best Practices

- Apps: `^x.y` constraints + lockfile.
- Libraries: `^x` minimum, no upper cap unless a known incompatibility.
- `composer audit` in CI.
- Avoid `*` constraints; avoid `dev-master` in published code.
- Reproducible installs: `composer install --no-dev --classmap-authoritative` for production images.
- Repositories: vcs only when no Packagist alternative.
- `replace`/`provide` only for explicit forks.
