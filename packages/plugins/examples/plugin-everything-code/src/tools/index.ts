import type { PluginContext, ToolResult, ToolRunContext } from "@paperclipai/plugin-sdk";
import { TOOL_NAMES, ENTITY_TYPES, STATE_KEYS } from "../constants.js";
import {
  AgentSpawner,
  InstinctStore,
  SecurityScanner,
  SkillLoader,
  VerificationRunner,
  detectEcosystem,
} from "../services/index.js";
import { renderPlan, renderReview, renderRefactor } from "./planning.js";
import { renderBuildFix, renderTddCycle } from "./engineering.js";
import {
  symfonyController,
  symfonyService,
  symfonyEntity,
  symfonyForm,
  symfonyVoter,
  symfonyDoctrineEntity,
  symfonyDoctrineRepository,
  symfonyDoctrineMigration,
  symfonyDoctrineQuery,
  symfonyTestPlan,
} from "./symfony.js";
import {
  theliaModuleSkeleton,
  theliaLoopClass,
  theliaHookListener,
  theliaTemplateOverride,
} from "./thelia.js";

export interface ToolRegistryDeps {
  loader: SkillLoader;
  spawner: AgentSpawner;
  instincts: InstinctStore;
  verifier: VerificationRunner;
  security: SecurityScanner;
}

export function registerAllTools(ctx: PluginContext, deps: ToolRegistryDeps): void {
  const { loader, spawner, instincts, verifier, security } = deps;

  ctx.tools.register(
    TOOL_NAMES.plan,
    {
      displayName: "Plan",
      description: "Produce a step-by-step implementation plan for an issue or task.",
      parametersSchema: { type: "object" },
    },
    async (params) => ({
      content: renderPlan(params as { issueId?: string; objective: string; constraints?: string }),
    }),
  );

  ctx.tools.register(
    TOOL_NAMES.codeReview,
    {
      displayName: "Code Review",
      description: "Review a diff or files using language-specific rules.",
      parametersSchema: { type: "object" },
    },
    async (params) => ({
      content: renderReview(params as { diff?: string; paths?: string[]; language?: string }),
    }),
  );

  ctx.tools.register(
    TOOL_NAMES.refactorClean,
    {
      displayName: "Refactor Clean",
      description: "Suggest a cleanup pass on the provided files using language standards.",
      parametersSchema: { type: "object" },
    },
    async (params) => ({
      content: renderRefactor(params as { paths?: string[]; language?: string }),
    }),
  );

  ctx.tools.register(
    TOOL_NAMES.buildFix,
    {
      displayName: "Build Fix",
      description: "Diagnose a build/compile error and propose a remediation.",
      parametersSchema: { type: "object" },
    },
    async (params) => ({
      content: renderBuildFix(params as { log?: string; language?: string }),
    }),
  );

  ctx.tools.register(
    TOOL_NAMES.tddGuide,
    {
      displayName: "TDD Guide",
      description: "Walk through a red/green/refactor TDD cycle for the given goal.",
      parametersSchema: { type: "object" },
    },
    async (params) => ({
      content: renderTddCycle(params as { objective: string; language?: string }),
    }),
  );

  ctx.tools.register(
    TOOL_NAMES.qualityGate,
    {
      displayName: "Quality Gate",
      description: "Score a project on coding standards, tests, security, observability.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const projectId = (params as { projectId?: string }).projectId;
      if (!projectId) return { error: "projectId is required" };
      const workspace = await ctx.projects.getPrimaryWorkspace(projectId, runCtx.companyId);
      if (!workspace) return { error: "no workspace configured" };
      const detection = await detectEcosystem(workspace.path);
      const securityReport = await security.scan(workspace.path);
      const score = Math.round((securityReport.score + detection.signals.length * 5) * 0.7);
      await ctx.state.set(
        { scopeKind: "project", scopeId: projectId, stateKey: STATE_KEYS.qualityScore },
        { score, ecosystem: detection.ecosystem, security: securityReport, updatedAt: new Date().toISOString() },
      );
      await ctx.entities.upsert({
        entityType: ENTITY_TYPES.qualityReport,
        scopeKind: "project",
        scopeId: projectId,
        externalId: `quality-${Date.now()}`,
        title: `Quality ${score}`,
        status: score >= 80 ? "good" : score >= 50 ? "warning" : "critical",
        data: { score, ecosystem: detection.ecosystem, signals: detection.signals, security: securityReport },
      });
      return {
        content: `Quality score: ${score}\nEcosystem: ${detection.ecosystem}\nSecurity findings: ${securityReport.findings.length}`,
        data: { score, ecosystem: detection.ecosystem, security: securityReport },
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.verifyLoop,
    {
      displayName: "Verify Loop",
      description: "Run a verification loop with checkpoints and stream progress to UI.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const objective = (params as { objective: string }).objective;
      const maxIterations = (params as { maxIterations?: number }).maxIterations ?? 1;
      const result = await verifier.run({
        companyId: runCtx.companyId,
        objective,
        maxIterations,
      });
      return {
        content: `Verify loop ${result.passed ? "passed" : "failed"} after ${result.iterations} iterations.`,
        data: result,
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.securityReview,
    {
      displayName: "Security Review",
      description: "Scan agent configuration files for secrets and prompt-injection risks.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const projectId = (params as { projectId?: string }).projectId;
      const workspace = projectId
        ? await ctx.projects.getPrimaryWorkspace(projectId, runCtx.companyId)
        : null;
      if (!workspace) return { error: "no workspace to scan" };
      const report = await security.scan(workspace.path);
      return {
        content: `Security score: ${report.score}, ${report.findings.length} findings across ${report.scannedFiles} files.`,
        data: report,
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.multiPlan,
    {
      displayName: "Multi Plan",
      description: "Spawn N planner agents in parallel and merge their plans.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) =>
      runMultiAgent(ctx, spawner, runCtx, {
        objective: (params as { objective: string }).objective,
        n: (params as { n?: number }).n ?? 3,
        kind: "plan",
      }),
  );

  ctx.tools.register(
    TOOL_NAMES.multiExecute,
    {
      displayName: "Multi Execute",
      description: "Run a fan-out execution across multiple agents.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const tasks = (params as { tasks: string[] }).tasks;
      return runMultiAgent(ctx, spawner, runCtx, {
        objective: tasks.join("\n"),
        n: tasks.length,
        kind: "execute",
      });
    },
  );

  ctx.tools.register(
    TOOL_NAMES.multiBackend,
    {
      displayName: "Multi Backend",
      description: "Run backend reviewers in parallel.",
      parametersSchema: { type: "object" },
    },
    async (_params, runCtx) =>
      runMultiAgent(ctx, spawner, runCtx, {
        objective: "Run backend reviewers across the project",
        n: 3,
        kind: "backend",
      }),
  );

  ctx.tools.register(
    TOOL_NAMES.multiFrontend,
    {
      displayName: "Multi Frontend",
      description: "Run frontend reviewers in parallel.",
      parametersSchema: { type: "object" },
    },
    async (_params, runCtx) =>
      runMultiAgent(ctx, spawner, runCtx, {
        objective: "Run frontend reviewers across the project",
        n: 3,
        kind: "frontend",
      }),
  );

  ctx.tools.register(
    TOOL_NAMES.instinctExtract,
    {
      displayName: "Instinct Extract",
      description: "Extract reusable patterns from recent commits/comments.",
      parametersSchema: { type: "object" },
    },
    async (_params, runCtx) => {
      const issues = await ctx.issues.list({ companyId: runCtx.companyId, limit: 25 });
      const patterns: string[] = [];
      for (const issue of issues) {
        const comments = await ctx.issues.listComments(issue.id, runCtx.companyId);
        for (const c of comments) {
          const m = c.body.match(/(do not|always|never|prefer)[^.\n]+/i);
          if (m) patterns.push(m[0].trim());
        }
      }
      const stored: string[] = [];
      for (const pattern of patterns) {
        const inst = await instincts.upsert(runCtx.companyId, {
          pattern,
          source: "comment",
          confidence: 0.4,
          hits: 1,
          status: "proposed",
        });
        stored.push(inst.id);
      }
      return {
        content: `Extracted ${stored.length} candidate instincts from recent comments.`,
        data: { instincts: stored },
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.instinctImport,
    {
      displayName: "Instinct Import",
      description: "Import a JSON instinct collection.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const json = (params as { json: string }).json;
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch (err) {
        return { error: `invalid JSON: ${(err as Error).message}` };
      }
      if (!Array.isArray(parsed)) return { error: "expected JSON array" };
      let count = 0;
      for (const raw of parsed) {
        if (!raw || typeof raw !== "object") continue;
        const obj = raw as Record<string, unknown>;
        const pattern = typeof obj.pattern === "string" ? obj.pattern : null;
        if (!pattern) continue;
        await instincts.upsert(runCtx.companyId, {
          pattern,
          source: typeof obj.source === "string" ? obj.source : "import",
          confidence: typeof obj.confidence === "number" ? obj.confidence : 0.5,
          hits: typeof obj.hits === "number" ? obj.hits : 1,
          status: "proposed",
        });
        count++;
      }
      return { content: `Imported ${count} instincts.` };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.instinctExport,
    {
      displayName: "Instinct Export",
      description: "Export the current instinct collection as JSON.",
      parametersSchema: { type: "object" },
    },
    async (_params, runCtx) => {
      const all = await instincts.list(runCtx.companyId);
      return { content: JSON.stringify(all, null, 2), data: all };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.evolve,
    {
      displayName: "Evolve",
      description: "Promote confirmed instincts to skills.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const minConfidence = (params as { minConfidence?: number }).minConfidence ?? 0.8;
      const promoted = await instincts.promoteAboveThreshold(runCtx.companyId, minConfidence);
      return {
        content: `Promoted ${promoted.length} instincts above ${minConfidence}.`,
        data: { promoted },
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.pm2,
    {
      displayName: "PM2",
      description: "Generate or update a pm2 ecosystem file template.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const { serviceName, cmd } = params as { serviceName: string; cmd: string };
      const ecosystem = {
        apps: [
          {
            name: serviceName,
            script: cmd,
            autorestart: true,
            max_memory_restart: "512M",
            env_production: { NODE_ENV: "production" },
          },
        ],
      };
      return { content: `module.exports = ${JSON.stringify(ecosystem, null, 2)};` };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.sessions,
    {
      displayName: "Sessions",
      description: "List active agent sessions.",
      parametersSchema: { type: "object" },
    },
    async (_params, runCtx) => {
      const agents = await ctx.agents.list({ companyId: runCtx.companyId, limit: 50 });
      const summaries: Array<{ agentId: string; agentName: string; sessions: number }> = [];
      for (const agent of agents) {
        const list = await ctx.agents.sessions.list(agent.id, runCtx.companyId);
        summaries.push({ agentId: agent.id, agentName: agent.name, sessions: list.length });
      }
      return {
        content: `Found ${summaries.reduce((acc, s) => acc + s.sessions, 0)} sessions across ${summaries.length} agents.`,
        data: summaries,
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.setupPm,
    {
      displayName: "Setup Package Manager",
      description: "Detect and document the package manager for a workspace.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const projectId = (params as { projectId?: string }).projectId;
      const workspace = projectId
        ? await ctx.projects.getPrimaryWorkspace(projectId, runCtx.companyId)
        : null;
      if (!workspace) return { error: "no workspace" };
      const detection = await detectEcosystem(workspace.path);
      const pm = pickPackageManager(detection.ecosystem);
      return {
        content: `Ecosystem: ${detection.ecosystem}\nRecommended package manager: ${pm}`,
        data: { ecosystem: detection.ecosystem, pm, signals: detection.signals },
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.symfonyScaffold,
    {
      displayName: "Symfony Scaffold",
      description: "Output a Symfony 7.x scaffold.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const { kind, name } = params as { kind: string; name: string };
      const generators: Record<string, (n: string) => string> = {
        controller: symfonyController,
        service: symfonyService,
        entity: symfonyEntity,
        form: symfonyForm,
        voter: symfonyVoter,
      };
      const fn = generators[kind];
      if (!fn) return { error: `unknown kind ${kind}` };
      return { content: fn(name) };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.symfonyDoctrine,
    {
      displayName: "Symfony Doctrine",
      description: "Help with a Doctrine entity, repository, migration or DBAL query.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const { task, spec } = params as { task: string; spec: string };
      const fns: Record<string, (s: string) => string> = {
        entity: symfonyDoctrineEntity,
        repository: symfonyDoctrineRepository,
        migration: symfonyDoctrineMigration,
        query: symfonyDoctrineQuery,
      };
      const fn = fns[task];
      if (!fn) return { error: `unknown task ${task}` };
      return { content: fn(spec) };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.symfonyTest,
    {
      displayName: "Symfony Test",
      description: "Generate a PHPUnit/Pest test plan for a Symfony component.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const { target, framework } = params as { target: string; framework?: "phpunit" | "pest" };
      return { content: symfonyTestPlan(target, framework ?? "phpunit") };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.theliaModule,
    {
      displayName: "Thelia Module",
      description: "Scaffold a Thelia 2.x module skeleton.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const name = (params as { name: string }).name;
      return { content: theliaModuleSkeleton(name) };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.theliaLoop,
    {
      displayName: "Thelia Loop",
      description: "Generate a Thelia loop class.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const { name, table } = params as { name: string; table?: string };
      return { content: theliaLoopClass(name, table ?? name.toLowerCase()) };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.theliaHook,
    {
      displayName: "Thelia Hook",
      description: "Generate a Thelia hook event listener.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const { code, target } = params as { code: string; target?: string };
      return { content: theliaHookListener(code, target ?? "frontOffice") };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.theliaTemplate,
    {
      displayName: "Thelia Template",
      description: "Generate a Thelia template override.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const template = (params as { template: string }).template;
      return { content: theliaTemplateOverride(template) };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.loadSkill,
    {
      displayName: "Load Skill",
      description:
        "Return the markdown body of a bundled skill so the agent can read it as context.",
      parametersSchema: { type: "object" },
    },
    async (params) => {
      const id = (params as { id: string }).id;
      const skill = await loader.get(id);
      if (!skill) return { error: `skill ${id} not found` };
      return { content: skill.body, data: { id: skill.id, title: skill.title } };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.spawnAgent,
    {
      displayName: "Spawn Agent",
      description: "Open a session with an existing Paperclip agent and send a prompt.",
      parametersSchema: { type: "object" },
    },
    async (params, runCtx) => {
      const { agentId, prompt, reason } = params as {
        agentId: string;
        prompt: string;
        reason?: string;
      };
      try {
        const result = await spawner.spawn({
          companyId: runCtx.companyId,
          agentId,
          prompt,
          reason,
        });
        return {
          content: `Spawned session ${result.sessionId} (run ${result.runId}).`,
          data: result,
        };
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
  );
}

async function runMultiAgent(
  ctx: PluginContext,
  spawner: AgentSpawner,
  runCtx: ToolRunContext,
  opts: { objective: string; n: number; kind: string },
): Promise<ToolResult> {
  const agents = await ctx.agents.list({ companyId: runCtx.companyId, limit: opts.n });
  if (agents.length === 0) {
    return {
      content: `No agents available to fan out kind=${opts.kind}.`,
      data: { spawned: 0 },
    };
  }
  const spawned: string[] = [];
  for (const agent of agents.slice(0, opts.n)) {
    try {
      const result = await spawner.spawn({
        companyId: runCtx.companyId,
        agentId: agent.id,
        prompt: `[multi-${opts.kind}] ${opts.objective}`,
        reason: `everything-code multi-${opts.kind}`,
      });
      spawned.push(result.sessionId);
    } catch (err) {
      ctx.logger.warn("multi-agent spawn failed", { agentId: agent.id, err: String(err) });
    }
  }
  await ctx.entities.upsert({
    entityType: ENTITY_TYPES.multiAgentRun,
    scopeKind: "company",
    scopeId: runCtx.companyId,
    externalId: `multi-${opts.kind}-${Date.now()}`,
    title: `multi-${opts.kind} (${spawned.length})`,
    status: "running",
    data: { kind: opts.kind, objective: opts.objective, sessionIds: spawned },
  });
  return {
    content: `Spawned ${spawned.length} ${opts.kind} agents.`,
    data: { spawned, kind: opts.kind, objective: opts.objective },
  };
}

function pickPackageManager(eco: string): string {
  switch (eco) {
    case "typescript":
    case "javascript":
      return "pnpm (preferred), npm or yarn";
    case "python":
      return "uv (preferred) or pip + venv";
    case "go":
      return "go modules";
    case "rust":
      return "cargo";
    case "java":
      return "gradle or maven";
    case "kotlin":
      return "gradle";
    case "swift":
      return "swift package manager";
    case "php":
    case "symfony":
    case "thelia":
      return "composer";
    case "ruby":
      return "bundler";
    case "elixir":
      return "mix";
    case "dart":
      return "pub";
    case "csharp":
      return "dotnet";
    default:
      return "language-specific";
  }
}
