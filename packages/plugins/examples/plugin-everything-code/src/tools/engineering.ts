export function renderBuildFix(input: { log?: string; language?: string }): string {
  const language = input.language ?? "auto";
  const log = (input.log ?? "").slice(0, 4000);
  const errorLine = log.split(/\r?\n/).find((l) => /error|failed|panic|fatal/i.test(l)) ?? "(no error line found)";
  return [
    `# Build Fix (language=${language})`,
    "",
    "## Top error",
    "```",
    errorLine,
    "```",
    "",
    "## Likely cause",
    likelyCause(language, errorLine),
    "",
    "## Fix",
    "1. Reproduce locally with the exact command from CI.",
    "2. Apply the smallest patch that resolves the cited error without papering over it.",
    "3. Re-run the failing target then the full quality gate.",
    "4. If the cause is environmental, capture it in a TODO at the call site and an instinct entry.",
    "",
    "## Verification",
    "- [ ] Quality gate green",
    "- [ ] No regression in adjacent tests",
    "- [ ] Logs no longer match the original signature",
  ].join("\n");
}

function likelyCause(language: string, line: string): string {
  if (/cannot find module|module not found/i.test(line)) {
    return "missing dependency — install or fix import path.";
  }
  if (/type .* not assignable|TS\d+/i.test(line)) {
    return "TypeScript type mismatch — narrow the input or fix the declared shape.";
  }
  if (/undefined (method|reference) on/i.test(line) || /Call to undefined method/.test(line)) {
    return "PHP fatal — verify class autoload, namespaces and method signatures.";
  }
  if (/cannot resolve symbol|unresolved reference/i.test(line)) {
    return "JVM symbol not on classpath — refresh dependencies / Gradle sync.";
  }
  if (/expected .* found/i.test(line)) {
    return "syntax error — check the exact span before/after the cited token.";
  }
  return `unable to classify automatically; inspect the cited line in language=${language}.`;
}

export function renderTddCycle(input: { objective: string; language?: string }): string {
  const lang = input.language ?? "auto";
  return [
    `# TDD Cycle (language=${lang}) — ${input.objective}`,
    "",
    "## RED",
    "- Write the smallest test that captures the new behavior.",
    "- Test name reads as the spec sentence, not as an implementation hint.",
    "- Run the test. Confirm it fails for the *intended* reason.",
    "",
    "## GREEN",
    "- Make the simplest possible change to pass the new test.",
    "- Do not touch unrelated tests or code.",
    "- Run the focused test then the full suite.",
    "",
    "## REFACTOR",
    "- Remove duplication introduced during GREEN.",
    "- Rename for clarity; remove now-dead branches.",
    "- Run tests again. Commit.",
    "",
    "## Done when",
    "- One commit per RED/GREEN/REFACTOR (or one squashed commit per cycle).",
    "- Coverage of the new behavior is real (not gamed by a tautological assertion).",
  ].join("\n");
}
