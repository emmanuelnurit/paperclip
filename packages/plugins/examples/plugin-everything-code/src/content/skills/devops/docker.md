---
title: Docker
description: Container conventions for production builds.
---

# Docker

- Reproducible builds. Pin versions. Lockfiles committed.
- Smallest base image that works. Multi-stage when it shrinks attack surface.
- Health and readiness probes for any long-running service.
- Secrets via the platform secret store; never in environment dumps or logs.
- Failures fail loud and locally; recover via orchestration.
