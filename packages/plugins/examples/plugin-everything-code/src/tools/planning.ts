export interface PlanInput {
  issueId?: string;
  objective: string;
  constraints?: string;
}

export function renderPlan(input: PlanInput): string {
  const intro = input.issueId
    ? `Plan for issue ${input.issueId}: ${input.objective}`
    : `Plan: ${input.objective}`;
  return [
    `# ${intro}`,
    "",
    "## Steps",
    "1. Read existing code paths impacted by the objective. List surfaces that mutate state.",
    "2. Identify invariants that must not break (data integrity, capability boundaries, single-assignee, atomic checkout).",
    "3. Write the smallest failing test that captures the desired behavior.",
    "4. Implement the change. Avoid speculative abstractions and dead branches.",
    "5. Run typecheck, tests and lint. Re-read the diff for security/perf regressions.",
    "6. Update docs only if the user-visible contract changed.",
    "",
    input.constraints ? `## Constraints\n${input.constraints}\n` : "",
    "## Deliverables",
    "- Concrete diff",
    "- Updated tests",
    "- Short PR description focused on WHY",
    "",
    "## Done when",
    "- All quality gates green",
    "- No new lint/type warnings",
    "- Activity logged via the appropriate Paperclip APIs",
  ].join("\n");
}

export interface ReviewInput {
  diff?: string;
  paths?: string[];
  language?: string;
}

export function renderReview(input: ReviewInput): string {
  const lang = input.language ?? "auto";
  const target = input.paths?.length
    ? `paths: ${input.paths.join(", ")}`
    : input.diff
      ? "diff (inline)"
      : "no input — describe a target";
  return [
    `# Code Review (language=${lang}) — ${target}`,
    "",
    "## Checklist",
    "- [ ] Every new branch is justified — no speculative abstraction.",
    "- [ ] No unreachable error handling for impossible cases.",
    "- [ ] No leftover console.log / dump / dd.",
    "- [ ] No secrets, tokens, or env values.",
    "- [ ] Naming clear; comments only for non-obvious WHY.",
    "- [ ] Tests cover happy path AND edge cases.",
    "- [ ] No backward-compat shim where a real cleanup is possible.",
    "- [ ] Public contract changes documented.",
    "",
    "## Language-specific gates",
    languageReviewGates(lang),
  ].join("\n");
}

export function renderRefactor(input: ReviewInput): string {
  const lang = input.language ?? "auto";
  return [
    `# Refactor Pass (language=${lang})`,
    "",
    "## Targets",
    ...(input.paths?.map((p) => `- ${p}`) ?? ["- (no paths supplied)"]),
    "",
    "## Method",
    "1. Inline single-use helpers; extract only on third repetition.",
    "2. Replace clever code with obvious code.",
    "3. Remove dead code and unused exports.",
    "4. Consolidate duplicated types.",
    "5. Re-run tests after each step. Commit per logical refactor.",
  ].join("\n");
}

function languageReviewGates(lang: string): string {
  switch (lang) {
    case "typescript":
    case "javascript":
      return "- strict TypeScript; no `any` without justification\n- prefer `unknown` over `any`\n- no floating promises";
    case "python":
      return "- type hints with mypy or pyright\n- no broad `except`\n- f-strings over `%` and `.format`";
    case "go":
      return "- no panic in libraries\n- error wrapping with %w\n- table-driven tests";
    case "rust":
      return "- avoid `unwrap`/`expect` in libraries\n- prefer `?` and `thiserror`\n- clippy clean";
    case "php":
    case "symfony":
    case "thelia":
      return "- PSR-12 / PER-CS\n- PHPStan level max\n- readonly classes / enums where appropriate\n- no `var_dump`/`die`";
    case "java":
    case "kotlin":
      return "- avoid checked exception leaks across modules\n- prefer immutability\n- `record` / `data class` where appropriate";
    default:
      return "- enforce ecosystem-specific linter and formatter";
  }
}
