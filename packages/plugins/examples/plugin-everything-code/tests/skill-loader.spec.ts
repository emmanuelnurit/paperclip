import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SkillLoader } from "../src/services/skill-loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("SkillLoader", () => {
  const loader = new SkillLoader(path.resolve(__dirname, "..", "src", "content"));

  it("lists bundled skills across categories", async () => {
    const list = await loader.list();
    expect(list.length).toBeGreaterThan(20);
    const cats = new Set(list.map((s) => s.category));
    expect(cats.has("php-ecosystem")).toBe(true);
    expect(cats.has("frontend")).toBe(true);
    expect(cats.has("backend")).toBe(true);
  });

  it("can fetch the Symfony architecture skill", async () => {
    const skill = await loader.get("php-ecosystem/symfony-architecture");
    expect(skill).not.toBeNull();
    expect(skill?.body).toContain("Symfony Architecture");
  });

  it("returns null for unknown skill ids", async () => {
    const skill = await loader.get("unknown/whatever");
    expect(skill).toBeNull();
  });
});
