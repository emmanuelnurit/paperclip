export const PLUGIN_ID = "paperclipai.everything-code";
export const PLUGIN_VERSION = "0.1.0";
export const PAGE_ROUTE = "everything-code";

export const SLOT_IDS = {
  page: "ec-page",
  settingsPage: "ec-settings-page",
  dashboardWidget: "ec-dashboard-widget",
  sidebar: "ec-sidebar-link",
  sidebarPanel: "ec-sidebar-panel",
  projectSidebarItem: "ec-project-link",
  projectTab: "ec-project-tab",
  issueTab: "ec-issue-tab",
  commentContextMenuItem: "ec-comment-action",
} as const;

export const EXPORT_NAMES = {
  page: "EverythingCodePage",
  settingsPage: "EverythingCodeSettingsPage",
  dashboardWidget: "EverythingCodeDashboardWidget",
  sidebar: "EverythingCodeSidebar",
  sidebarPanel: "EverythingCodeSidebarPanel",
  projectSidebarItem: "EverythingCodeProjectSidebarItem",
  projectTab: "EverythingCodeProjectTab",
  issueTab: "EverythingCodeIssueTab",
  commentContextMenuItem: "EverythingCodeCommentMenuItem",
} as const;

export const JOB_KEYS = {
  instinctEvaluator: "instinct-evaluator",
  memoryCompactor: "memory-compactor",
  qualityRollup: "quality-rollup",
} as const;

export const WEBHOOK_KEYS = {
  ciFeedback: "ci-feedback",
} as const;

export const TOOL_NAMES = {
  // Planning & review
  plan: "plan",
  codeReview: "code-review",
  refactorClean: "refactor-clean",
  buildFix: "build-fix",
  qualityGate: "quality-gate",
  verifyLoop: "verify-loop",
  tddGuide: "tdd-guide",
  securityReview: "security-review",
  // Multi-agent orchestration
  multiPlan: "multi-plan",
  multiExecute: "multi-execute",
  multiBackend: "multi-backend",
  multiFrontend: "multi-frontend",
  // Continuous learning
  instinctExtract: "instinct-extract",
  instinctImport: "instinct-import",
  instinctExport: "instinct-export",
  evolve: "evolve",
  // Service / process management
  pm2: "pm2",
  sessions: "sessions",
  setupPm: "setup-pm",
  // Symfony
  symfonyScaffold: "symfony-scaffold",
  symfonyDoctrine: "symfony-doctrine",
  symfonyTest: "symfony-test",
  // Thelia
  theliaModule: "thelia-module",
  theliaLoop: "thelia-loop",
  theliaHook: "thelia-hook",
  theliaTemplate: "thelia-template",
  // Skills/agents catalog
  loadSkill: "load-skill",
  spawnAgent: "spawn-agent",
} as const;

export const STREAM_CHANNELS = {
  verifyLog: "verify-log",
  multiAgent: "multi-agent",
  toolFeed: "tool-feed",
} as const;

export const STATE_KEYS = {
  hookProfile: "hook-profile",
  enabledSkills: "enabled-skills",
  installedHarnesses: "installed-harnesses",
  lastCiBuild: "last-ci-build",
  qualityScore: "quality-score",
} as const;

export const ENTITY_TYPES = {
  instinct: "everything-code/instinct",
  qualityReport: "everything-code/quality-report",
  buildFailure: "everything-code/build-failure",
  multiAgentRun: "everything-code/multi-agent-run",
} as const;

export const HOOK_PROFILES = ["minimal", "standard", "strict"] as const;
export type HookProfile = (typeof HOOK_PROFILES)[number];

export const SUPPORTED_HARNESSES = [
  "claude-code",
  "codex",
  "cursor",
  "opencode",
] as const;
export type SupportedHarness = (typeof SUPPORTED_HARNESSES)[number];

export const DEFAULT_CONFIG = {
  hookProfile: "standard" as HookProfile,
  publishSkillsToHarness: true,
  enabledHarnesses: ["claude-code"] as SupportedHarness[],
  enableSecurityScanner: true,
  enableInstinctLearning: true,
  ciFeedbackAutoFix: false,
  defaultLanguage: "auto",
  promptAugmentationEnabled: true,
  qualityGateThreshold: 80,
} as const;
