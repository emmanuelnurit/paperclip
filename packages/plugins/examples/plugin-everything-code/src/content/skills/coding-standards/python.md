---
title: Python Coding Standards
description: Modern Python (3.12+) with type hints, async, and pragmatic project hygiene.
---

# Python Coding Standards

## Tooling

- `uv` for env + dependencies. `pyproject.toml`. Never commit `requirements.txt` for libraries.
- `ruff` for lint + format. `mypy --strict` or `pyright`.

## Code

- Type hints on every public function. Use `from __future__ import annotations` for forward refs.
- `dataclasses(slots=True, kw_only=True)` for value types. `pydantic.BaseModel` only at I/O edges.
- Avoid mutable default arguments. Avoid global state.
- Prefer `pathlib.Path` over `os.path`.

## Errors

- Specific `except` clauses. Never bare `except:`.
- Re-raise with `raise X from e` to preserve causality.
- Custom exceptions only when callers need to differentiate handling.

## Async

- `asyncio` first; threads only for CPU-bound C extensions or blocking I/O.
- Use `asyncio.TaskGroup` (3.11+) for structured concurrency.

## Tests

- `pytest` + `pytest-asyncio`. `pytest-cov` with realistic thresholds.
- Fixtures over test setup classes. No magic globals.
