import { describe, it, expect } from "vitest";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { SecurityScanner } from "../src/services/security-scanner.js";

describe("SecurityScanner", () => {
  it("flags a hardcoded API key in CLAUDE.md", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ec-secscan-"));
    await fs.writeFile(
      path.join(dir, "CLAUDE.md"),
      "Some text\nAPI_KEY=\"sk-abcdefghijklmnopqrstuvwxyz123456\"\n",
    );
    const scanner = new SecurityScanner();
    const report = await scanner.scan(dir);
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.findings.some((f) => f.category === "secret")).toBe(true);
    expect(report.score).toBeLessThan(100);
  });

  it("returns a perfect score on clean workspaces", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ec-secscan-clean-"));
    await fs.writeFile(path.join(dir, "AGENTS.md"), "# Agents\nNo secrets here.\n");
    const scanner = new SecurityScanner();
    const report = await scanner.scan(dir);
    expect(report.findings).toEqual([]);
    expect(report.score).toBe(100);
  });
});
