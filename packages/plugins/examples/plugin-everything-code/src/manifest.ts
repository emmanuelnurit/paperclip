import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  DEFAULT_CONFIG,
  EXPORT_NAMES,
  HOOK_PROFILES,
  JOB_KEYS,
  PAGE_ROUTE,
  PLUGIN_ID,
  PLUGIN_VERSION,
  SLOT_IDS,
  SUPPORTED_HARNESSES,
  TOOL_NAMES,
  WEBHOOK_KEYS,
} from "./constants.js";

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Everything Code",
  description:
    "Skills, agents, tools, hooks installer and prompt augmentations covering modern web languages plus Symfony and Thelia. Reproduces the everything-claude-code architecture as a self-contained Paperclip plugin.",
  author: "Paperclip",
  categories: ["automation", "ui", "workspace", "connector"],
  capabilities: [
    "companies.read",
    "projects.read",
    "project.workspaces.read",
    "issues.read",
    "issues.create",
    "issues.update",
    "issue.comments.read",
    "issue.comments.create",
    "issue.documents.read",
    "issue.documents.write",
    "agents.read",
    "agents.invoke",
    "agent.sessions.create",
    "agent.sessions.list",
    "agent.sessions.send",
    "agent.sessions.close",
    "goals.read",
    "goals.create",
    "goals.update",
    "activity.log.write",
    "metrics.write",
    "telemetry.track",
    "plugin.state.read",
    "plugin.state.write",
    "events.subscribe",
    "events.emit",
    "jobs.schedule",
    "webhooks.receive",
    "http.outbound",
    "secrets.read-ref",
    "agent.tools.register",
    "instance.settings.register",
    "ui.sidebar.register",
    "ui.page.register",
    "ui.detailTab.register",
    "ui.dashboardWidget.register",
    "ui.action.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      hookProfile: {
        type: "string",
        title: "Hook Profile",
        description:
          "Profile applied when installing harness hooks. Minimal: notifications only. Standard: format + secret scan. Strict: full quality gate.",
        enum: [...HOOK_PROFILES],
        default: DEFAULT_CONFIG.hookProfile,
      },
      publishSkillsToHarness: {
        type: "boolean",
        title: "Publish Skills To Harness",
        description:
          "When true, the install-harness action copies the bundled skills into the selected harness directories.",
        default: DEFAULT_CONFIG.publishSkillsToHarness,
      },
      enabledHarnesses: {
        type: "array",
        title: "Enabled Harnesses",
        description: "Targets considered by the install-harness action.",
        items: { type: "string", enum: [...SUPPORTED_HARNESSES] },
        default: [...DEFAULT_CONFIG.enabledHarnesses],
      },
      enableSecurityScanner: {
        type: "boolean",
        title: "Enable Security Scanner",
        default: DEFAULT_CONFIG.enableSecurityScanner,
      },
      enableInstinctLearning: {
        type: "boolean",
        title: "Enable Instinct Learning",
        description:
          "Allow instinct-evaluator to scan recent runs and promote confirmed patterns to skills.",
        default: DEFAULT_CONFIG.enableInstinctLearning,
      },
      ciFeedbackAutoFix: {
        type: "boolean",
        title: "Auto-fix on CI Feedback",
        description:
          "When a webhook reports a failed CI build, automatically open a fix issue and invoke the build-resolver agent.",
        default: DEFAULT_CONFIG.ciFeedbackAutoFix,
      },
      defaultLanguage: {
        type: "string",
        title: "Default Language",
        description: "Used when language detection cannot determine the project ecosystem.",
        default: DEFAULT_CONFIG.defaultLanguage,
      },
      promptAugmentationEnabled: {
        type: "boolean",
        title: "Augment Native Paperclip Prompts",
        description:
          "Drop complementary references next to skills/paperclip/references so heartbeat agents see additional guidance. Never edits the core skill file.",
        default: DEFAULT_CONFIG.promptAugmentationEnabled,
      },
      qualityGateThreshold: {
        type: "number",
        title: "Quality Gate Threshold (0-100)",
        default: DEFAULT_CONFIG.qualityGateThreshold,
      },
    },
  },
  jobs: [
    {
      jobKey: JOB_KEYS.instinctEvaluator,
      displayName: "Instinct Evaluator",
      description:
        "Recompute confidence on stored instincts and promote high-confidence ones to skills.",
      schedule: "0 */6 * * *",
    },
    {
      jobKey: JOB_KEYS.memoryCompactor,
      displayName: "Memory Compactor",
      description: "Trim old multi-agent run logs and verification streams.",
      schedule: "30 3 * * *",
    },
    {
      jobKey: JOB_KEYS.qualityRollup,
      displayName: "Quality Gate Rollup",
      description: "Aggregate per-project quality metrics every 15 minutes.",
      schedule: "*/15 * * * *",
    },
  ],
  webhooks: [
    {
      endpointKey: WEBHOOK_KEYS.ciFeedback,
      displayName: "CI Feedback",
      description:
        "Receive CI build payloads (GitHub Actions / GitLab) and surface failures back into Paperclip issues.",
    },
  ],
  tools: [
    {
      name: TOOL_NAMES.plan,
      displayName: "Plan",
      description: "Produce a step-by-step implementation plan for an issue or task.",
      parametersSchema: {
        type: "object",
        properties: {
          issueId: { type: "string" },
          objective: { type: "string" },
          constraints: { type: "string" },
        },
        required: ["objective"],
      },
    },
    {
      name: TOOL_NAMES.codeReview,
      displayName: "Code Review",
      description: "Review a diff or files using language-specific rules.",
      parametersSchema: {
        type: "object",
        properties: {
          diff: { type: "string" },
          paths: { type: "array", items: { type: "string" } },
          language: { type: "string" },
        },
      },
    },
    {
      name: TOOL_NAMES.refactorClean,
      displayName: "Refactor Clean",
      description: "Suggest a cleanup pass on the provided files using language standards.",
      parametersSchema: {
        type: "object",
        properties: {
          paths: { type: "array", items: { type: "string" } },
          language: { type: "string" },
        },
      },
    },
    {
      name: TOOL_NAMES.buildFix,
      displayName: "Build Fix",
      description: "Diagnose a build/compile error and propose a remediation.",
      parametersSchema: {
        type: "object",
        properties: {
          log: { type: "string" },
          language: { type: "string" },
        },
        required: ["log"],
      },
    },
    {
      name: TOOL_NAMES.qualityGate,
      displayName: "Quality Gate",
      description: "Score a project on coding standards, tests, security, observability.",
      parametersSchema: {
        type: "object",
        properties: { projectId: { type: "string" } },
        required: ["projectId"],
      },
    },
    {
      name: TOOL_NAMES.verifyLoop,
      displayName: "Verify Loop",
      description: "Run a verification loop with checkpoints and stream progress to UI.",
      parametersSchema: {
        type: "object",
        properties: {
          objective: { type: "string" },
          maxIterations: { type: "number" },
        },
        required: ["objective"],
      },
    },
    {
      name: TOOL_NAMES.tddGuide,
      displayName: "TDD Guide",
      description: "Walk through a red/green/refactor TDD cycle for the given goal.",
      parametersSchema: {
        type: "object",
        properties: {
          objective: { type: "string" },
          language: { type: "string" },
        },
        required: ["objective"],
      },
    },
    {
      name: TOOL_NAMES.securityReview,
      displayName: "Security Review",
      description: "Scan agent configuration files for secrets and prompt-injection risks.",
      parametersSchema: {
        type: "object",
        properties: { projectId: { type: "string" } },
      },
    },
    {
      name: TOOL_NAMES.multiPlan,
      displayName: "Multi Plan",
      description: "Spawn N planner agents in parallel and merge their plans.",
      parametersSchema: {
        type: "object",
        properties: {
          objective: { type: "string" },
          n: { type: "number", default: 3 },
        },
        required: ["objective"],
      },
    },
    {
      name: TOOL_NAMES.multiExecute,
      displayName: "Multi Execute",
      description: "Run a fan-out execution across multiple agents.",
      parametersSchema: {
        type: "object",
        properties: {
          tasks: { type: "array", items: { type: "string" } },
        },
        required: ["tasks"],
      },
    },
    {
      name: TOOL_NAMES.multiBackend,
      displayName: "Multi Backend",
      description: "Run backend reviewers in parallel.",
      parametersSchema: {
        type: "object",
        properties: { projectId: { type: "string" } },
      },
    },
    {
      name: TOOL_NAMES.multiFrontend,
      displayName: "Multi Frontend",
      description: "Run frontend reviewers in parallel.",
      parametersSchema: {
        type: "object",
        properties: { projectId: { type: "string" } },
      },
    },
    {
      name: TOOL_NAMES.instinctExtract,
      displayName: "Instinct Extract",
      description: "Extract reusable patterns from recent commits/comments.",
      parametersSchema: {
        type: "object",
        properties: { since: { type: "string" } },
      },
    },
    {
      name: TOOL_NAMES.instinctImport,
      displayName: "Instinct Import",
      description: "Import a JSON instinct collection.",
      parametersSchema: {
        type: "object",
        properties: { json: { type: "string" } },
        required: ["json"],
      },
    },
    {
      name: TOOL_NAMES.instinctExport,
      displayName: "Instinct Export",
      description: "Export the current instinct collection as JSON.",
      parametersSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: TOOL_NAMES.evolve,
      displayName: "Evolve",
      description: "Promote confirmed instincts to skills.",
      parametersSchema: {
        type: "object",
        properties: { minConfidence: { type: "number" } },
      },
    },
    {
      name: TOOL_NAMES.pm2,
      displayName: "PM2",
      description: "Generate or update a pm2 ecosystem file template.",
      parametersSchema: {
        type: "object",
        properties: {
          serviceName: { type: "string" },
          cmd: { type: "string" },
        },
        required: ["serviceName", "cmd"],
      },
    },
    {
      name: TOOL_NAMES.sessions,
      displayName: "Sessions",
      description: "List active agent sessions.",
      parametersSchema: { type: "object", properties: {} },
    },
    {
      name: TOOL_NAMES.setupPm,
      displayName: "Setup Package Manager",
      description: "Detect and document the package manager for a workspace.",
      parametersSchema: {
        type: "object",
        properties: { projectId: { type: "string" } },
      },
    },
    {
      name: TOOL_NAMES.symfonyScaffold,
      displayName: "Symfony Scaffold",
      description: "Output a Symfony 7.x scaffold (controller/service/entity).",
      parametersSchema: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["controller", "service", "entity", "form", "voter"] },
          name: { type: "string" },
        },
        required: ["kind", "name"],
      },
    },
    {
      name: TOOL_NAMES.symfonyDoctrine,
      displayName: "Symfony Doctrine",
      description: "Help with a Doctrine entity, repository, migration or DBAL query.",
      parametersSchema: {
        type: "object",
        properties: {
          task: { type: "string", enum: ["entity", "repository", "migration", "query"] },
          spec: { type: "string" },
        },
        required: ["task", "spec"],
      },
    },
    {
      name: TOOL_NAMES.symfonyTest,
      displayName: "Symfony Test",
      description: "Generate a PHPUnit/Pest test plan for a Symfony component.",
      parametersSchema: {
        type: "object",
        properties: {
          target: { type: "string" },
          framework: { type: "string", enum: ["phpunit", "pest"] },
        },
        required: ["target"],
      },
    },
    {
      name: TOOL_NAMES.theliaModule,
      displayName: "Thelia Module",
      description: "Scaffold a Thelia 2.x module skeleton.",
      parametersSchema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
    {
      name: TOOL_NAMES.theliaLoop,
      displayName: "Thelia Loop",
      description: "Generate a Thelia loop class.",
      parametersSchema: {
        type: "object",
        properties: { name: { type: "string" }, table: { type: "string" } },
        required: ["name"],
      },
    },
    {
      name: TOOL_NAMES.theliaHook,
      displayName: "Thelia Hook",
      description: "Generate a Thelia hook event listener.",
      parametersSchema: {
        type: "object",
        properties: { code: { type: "string" }, target: { type: "string" } },
        required: ["code"],
      },
    },
    {
      name: TOOL_NAMES.theliaTemplate,
      displayName: "Thelia Template",
      description: "Generate a Thelia template override.",
      parametersSchema: {
        type: "object",
        properties: { template: { type: "string" } },
        required: ["template"],
      },
    },
    {
      name: TOOL_NAMES.loadSkill,
      displayName: "Load Skill",
      description:
        "Return the markdown body of a bundled skill so the agent can read it as context.",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
    {
      name: TOOL_NAMES.spawnAgent,
      displayName: "Spawn Agent",
      description:
        "Open a session with an existing Paperclip agent and send a prompt.",
      parametersSchema: {
        type: "object",
        properties: {
          agentId: { type: "string" },
          prompt: { type: "string" },
          reason: { type: "string" },
        },
        required: ["agentId", "prompt"],
      },
    },
  ],
  ui: {
    slots: [
      {
        type: "page",
        id: SLOT_IDS.page,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.page,
        routePath: PAGE_ROUTE,
      },
      {
        type: "settingsPage",
        id: SLOT_IDS.settingsPage,
        displayName: "Everything Code Settings",
        exportName: EXPORT_NAMES.settingsPage,
      },
      {
        type: "dashboardWidget",
        id: SLOT_IDS.dashboardWidget,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.dashboardWidget,
      },
      {
        type: "sidebar",
        id: SLOT_IDS.sidebar,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.sidebar,
      },
      {
        type: "sidebarPanel",
        id: SLOT_IDS.sidebarPanel,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.sidebarPanel,
      },
      {
        type: "projectSidebarItem",
        id: SLOT_IDS.projectSidebarItem,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.projectSidebarItem,
        entityTypes: ["project"],
      },
      {
        type: "detailTab",
        id: SLOT_IDS.projectTab,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.projectTab,
        entityTypes: ["project"],
      },
      {
        type: "detailTab",
        id: SLOT_IDS.issueTab,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.issueTab,
        entityTypes: ["issue"],
      },
      {
        type: "commentContextMenuItem",
        id: SLOT_IDS.commentContextMenuItem,
        displayName: "Everything Code",
        exportName: EXPORT_NAMES.commentContextMenuItem,
        entityTypes: ["comment"],
      },
    ],
  },
};

export default manifest;
