import { describe, expect, it } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";

const COMPANY_ID = "00000000-0000-0000-0000-000000000aaa";
const PROJECT_ID = "00000000-0000-0000-0000-000000000bbb";
const ISSUE_ID = "00000000-0000-0000-0000-000000000ccc";

describe("plugin-everything-code", () => {
  it("has a valid manifest with all expected slots", () => {
    expect(manifest.id).toBe("paperclipai.everything-code");
    const slotIds = (manifest.ui?.slots ?? []).map((s) => s.id);
    expect(slotIds).toContain("ec-page");
    expect(slotIds).toContain("ec-settings-page");
    expect(slotIds).toContain("ec-dashboard-widget");
    expect(slotIds).toContain("ec-issue-tab");
  });

  it("declares all advertised tools in the manifest", () => {
    const toolNames = (manifest.tools ?? []).map((t) => t.name);
    expect(toolNames).toContain("plan");
    expect(toolNames).toContain("symfony-scaffold");
    expect(toolNames).toContain("thelia-module");
    expect(toolNames).toContain("verify-loop");
    expect(toolNames.length).toBeGreaterThanOrEqual(20);
  });

  const minimalParams: Record<string, Record<string, unknown>> = {
    plan: { objective: "Test" },
    "code-review": { diff: "" },
    "refactor-clean": { paths: [] },
    "build-fix": { log: "Error: nothing" },
    "tdd-guide": { objective: "Test" },
    "verify-loop": { objective: "Test" },
    "security-review": {},
    "quality-gate": { projectId: "missing" },
    "multi-plan": { objective: "Test", n: 1 },
    "multi-execute": { tasks: ["one"] },
    "multi-backend": {},
    "multi-frontend": {},
    "instinct-extract": {},
    "instinct-import": { json: "[]" },
    "instinct-export": {},
    evolve: { minConfidence: 0.8 },
    pm2: { serviceName: "svc", cmd: "node app.js" },
    sessions: {},
    "setup-pm": { projectId: "missing" },
    "symfony-scaffold": { kind: "controller", name: "Foo" },
    "symfony-doctrine": { task: "entity", spec: "Foo" },
    "symfony-test": { target: "FooService", framework: "phpunit" },
    "thelia-module": { name: "Foo" },
    "thelia-loop": { name: "FooLoop" },
    "thelia-hook": { code: "foo" },
    "thelia-template": { template: "product.html" },
    "load-skill": { id: "coding-standards/php" },
    "spawn-agent": { agentId: "missing", prompt: "Hi" },
  };

  it("registers every declared tool", async () => {
    const harness = createTestHarness({ manifest });
    await plugin.definition.setup(harness.ctx);
    for (const tool of manifest.tools ?? []) {
      const params = minimalParams[tool.name] ?? {};
      const result = await harness.executeTool(tool.name, params, { companyId: COMPANY_ID });
      expect(result, `tool ${tool.name} should return a result`).toBeTruthy();
    }
  });

  it("plan tool returns a structured plan", async () => {
    const harness = createTestHarness({ manifest });
    await plugin.definition.setup(harness.ctx);
    const result = await harness.executeTool("plan", { objective: "Add new endpoint" });
    expect(result.content).toContain("Plan");
    expect(result.content).toContain("Steps");
  });

  it("symfony-scaffold returns valid PHP for a controller", async () => {
    const harness = createTestHarness({ manifest });
    await plugin.definition.setup(harness.ctx);
    const result = await harness.executeTool("symfony-scaffold", {
      kind: "controller",
      name: "Foo Bar",
    });
    expect(result.content).toContain("declare(strict_types=1);");
    expect(result.content).toContain("FooBarController");
    expect(result.content).toContain("AbstractController");
  });

  it("thelia-module returns a module skeleton", async () => {
    const harness = createTestHarness({ manifest });
    await plugin.definition.setup(harness.ctx);
    const result = await harness.executeTool("thelia-module", { name: "Foo" });
    expect(result.content).toContain("local/modules/Foo");
    expect(result.content).toContain("MODULE_DOMAIN");
  });

  it("dashboard-overview data handler responds", async () => {
    const harness = createTestHarness({ manifest });
    await plugin.definition.setup(harness.ctx);
    harness.seed({
      companies: [
        {
          id: COMPANY_ID,
          name: "Acme",
          status: "active",
        } as never,
      ],
    });
    const result = await harness.getData<{ skillCount: number }>(
      "dashboard-overview",
      { companyId: COMPANY_ID },
    );
    expect(result).toBeTruthy();
    expect(typeof result.skillCount).toBe("number");
  });

  it("hook-profile action persists the profile in instance state", async () => {
    const harness = createTestHarness({ manifest });
    await plugin.definition.setup(harness.ctx);
    await harness.performAction("set-hook-profile", { profile: "strict" });
    const stored = harness.getState({ scopeKind: "instance", stateKey: "hook-profile" });
    expect(stored).toBe("strict");
  });
});
