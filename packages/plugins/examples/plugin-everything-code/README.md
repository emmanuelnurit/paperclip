# `@paperclipai/plugin-everything-code`

A self-contained Paperclip plugin that reproduces the philosophy of
[`affaan-m/everything-claude-code`](https://github.com/affaan-m/everything-claude-code)
without touching the Paperclip core.

## What it ships

- **Skills** — modern web languages plus a curated **Symfony** and **Thelia** catalog. Bundled
  as plain markdown under `src/content/skills/`.
- **Agents** — markdown subagent definitions distributable to harness directories.
- **Rules and contexts** — opt-in policy fragments and dev/review/research/ship contexts.
- **Tools** registered with Paperclip's `ctx.tools.register` for in-Paperclip agent invocation
  (`plan`, `code-review`, `verify-loop`, `quality-gate`, `security-review`,
  `multi-plan`, `instinct-extract`, `symfony-scaffold`, `thelia-module`, …).
- **Jobs** for the instinct evaluator, memory compaction and quality rollup.
- **CI feedback webhook** that records failures and (optionally) opens a fix issue.
- **UI surfaces** — full page, dashboard widget, sidebar, project tab, issue tab,
  comment context-menu, settings page.
- **Harness installer** that drops skills + agents + rules + a hook profile into
  `~/.claude`, `~/.codex`, `~/.cursor`, or `~/.opencode` on demand.
- **Prompt augmenter** that writes complementary references next to
  `skills/paperclip/references` without ever editing the core skill file.

## What it does not touch

- `server/`, `ui/`, `packages/db/`, `packages/shared/`, `packages/adapters/`
- `skills/paperclip/SKILL.md`
- The core plugin runtime

## Develop

```bash
pnpm --filter @paperclipai/plugin-sdk build
pnpm --filter @paperclipai/plugin-everything-code typecheck
pnpm --filter @paperclipai/plugin-everything-code test
pnpm --filter @paperclipai/plugin-everything-code build
```

## Install (local-path)

```bash
curl -X POST http://127.0.0.1:3100/api/plugins/install \
  -H 'Content-Type: application/json' \
  -d '{"packageName":"/absolute/path/to/plugin-everything-code","isLocalPath":true}'
```

## Architecture map

| Concept (everything-claude-code) | Paperclip equivalent shipped here |
|---|---|
| `agents/`, `skills/`, `rules/`, `contexts/` | `src/content/{agents,skills,rules,contexts}/` |
| `commands/` (slash) | tools registered via `ctx.tools.register` |
| `hooks/` | hook profile JSON written by `HarnessInstaller` |
| `mcp-configs/` | (out of scope for this PR) |
| `scripts/` | TypeScript services under `src/services/` |
| `ecc2/` Rust dashboard | UI bundle (page + dashboard widget + settings) |

## Configuration

See the `instanceConfigSchema` in `src/manifest.ts`. Key knobs:

- `hookProfile`: `minimal` / `standard` / `strict`
- `enabledHarnesses`: subset of `claude-code`, `codex`, `cursor`, `opencode`
- `promptAugmentationEnabled`: drop complementary refs into the active harness
- `ciFeedbackAutoFix`: auto-create an issue on a CI failure webhook
- `qualityGateThreshold`: 0–100 score threshold for the quality gate
