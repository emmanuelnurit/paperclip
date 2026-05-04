import {
  definePlugin,
  runWorker,
  type PluginContext,
  type PluginHealthDiagnostics,
} from "@paperclipai/plugin-sdk";
import { WEBHOOK_KEYS } from "./constants.js";
import {
  AgentSpawner,
  HarnessInstaller,
  InstinctStore,
  PromptAugmenter,
  SecurityScanner,
  SkillLoader,
  VerificationRunner,
} from "./services/index.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllJobs } from "./jobs/index.js";
import { registerAllData } from "./data/index.js";
import { registerAllActions } from "./actions/index.js";
import { handleCiFeedback } from "./webhooks/ci-feedback.js";

let activeCtx: PluginContext | null = null;

const plugin = definePlugin({
  async setup(ctx: PluginContext) {
    activeCtx = ctx;
    ctx.logger.info("everything-code worker starting");

    const loader = new SkillLoader();
    const instincts = new InstinctStore(ctx);
    const spawner = new AgentSpawner(ctx);
    const security = new SecurityScanner();
    const verifier = new VerificationRunner(ctx);
    const installer = new HarnessInstaller(loader);
    const augmenter = new PromptAugmenter(loader);

    registerAllTools(ctx, { loader, spawner, instincts, verifier, security });
    registerAllJobs(ctx, { instincts });
    registerAllData(ctx, { loader, instincts });
    registerAllActions(ctx, { loader, installer, augmenter });

    ctx.events.on("issue.created", async (event) => {
      const config = (await ctx.config.get()) as { promptAugmentationEnabled?: boolean };
      if (config.promptAugmentationEnabled === false) return;
      ctx.logger.debug("issue.created seen", { entityId: event.entityId });
    });
  },

  async onWebhook(input) {
    if (!activeCtx) return;
    if (input.endpointKey === WEBHOOK_KEYS.ciFeedback) {
      await handleCiFeedback(activeCtx, input);
    }
  },

  async onHealth(): Promise<PluginHealthDiagnostics> {
    return { status: "ok", message: "everything-code ready" };
  },

  async onShutdown() {
    activeCtx = null;
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
