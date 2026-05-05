import { promises as fs } from "node:fs";
import path from "node:path";

export type Ecosystem =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "kotlin"
  | "swift"
  | "php"
  | "symfony"
  | "thelia"
  | "ruby"
  | "csharp"
  | "elixir"
  | "scala"
  | "dart"
  | "zig"
  | "unknown";

export interface DetectionResult {
  ecosystem: Ecosystem;
  signals: string[];
}

const FILE_SIGNALS: Array<[string, Ecosystem]> = [
  ["package.json", "typescript"],
  ["tsconfig.json", "typescript"],
  ["pnpm-workspace.yaml", "typescript"],
  ["pyproject.toml", "python"],
  ["requirements.txt", "python"],
  ["go.mod", "go"],
  ["Cargo.toml", "rust"],
  ["pom.xml", "java"],
  ["build.gradle", "java"],
  ["build.gradle.kts", "kotlin"],
  ["Package.swift", "swift"],
  ["composer.json", "php"],
  ["Gemfile", "ruby"],
  ["mix.exs", "elixir"],
  ["build.sbt", "scala"],
  ["pubspec.yaml", "dart"],
  ["build.zig", "zig"],
  ["*.csproj", "csharp"],
];

export async function detectEcosystem(workspacePath: string): Promise<DetectionResult> {
  const signals: string[] = [];
  let ecosystem: Ecosystem = "unknown";
  let entries: string[];
  try {
    entries = await fs.readdir(workspacePath);
  } catch {
    return { ecosystem, signals };
  }
  const set = new Set(entries);
  for (const [name, eco] of FILE_SIGNALS) {
    if (name.startsWith("*.")) {
      const ext = name.slice(1);
      if (entries.some((e) => e.endsWith(ext))) {
        signals.push(`found ${name}`);
        if (ecosystem === "unknown") ecosystem = eco;
      }
      continue;
    }
    if (set.has(name)) {
      signals.push(`found ${name}`);
      if (ecosystem === "unknown") ecosystem = eco;
    }
  }
  if (ecosystem === "php" && set.has("composer.json")) {
    try {
      const raw = await fs.readFile(path.join(workspacePath, "composer.json"), "utf8");
      const json = JSON.parse(raw) as { require?: Record<string, string> };
      const deps = Object.keys(json.require ?? {});
      if (deps.some((d) => d.startsWith("thelia/"))) {
        ecosystem = "thelia";
        signals.push("composer require contains thelia/*");
      } else if (deps.some((d) => d.startsWith("symfony/"))) {
        ecosystem = "symfony";
        signals.push("composer require contains symfony/*");
      }
    } catch {
      // ignore parse errors
    }
  }
  return { ecosystem, signals };
}
