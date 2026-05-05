import type { PluginContext } from "@paperclipai/plugin-sdk";
import {
  HOOK_PROFILES,
  STATE_KEYS,
  SUPPORTED_HARNESSES,
  type HookProfile,
  type SupportedHarness,
} from "../constants.js";
import type { HarnessInstaller, PromptAugmenter, SkillLoader } from "../services/index.js";

export interface ActionDeps {
  loader: SkillLoader;
  installer: HarnessInstaller;
  augmenter: PromptAugmenter;
}

export function registerAllActions(ctx: PluginContext, deps: ActionDeps): void {
  ctx.actions.register("install-harness", async (params) => {
    const profileInput = String(params.profile ?? "standard");
    const profile: HookProfile = (HOOK_PROFILES as readonly string[]).includes(profileInput)
      ? (profileInput as HookProfile)
      : "standard";
    const harnesses = parseHarnesses(params.harnesses);
    const reports = await deps.installer.install({
      harnesses,
      hookProfile: profile,
      publishSkills: params.publishSkills !== false,
    });
    await ctx.state.set(
      { scopeKind: "instance", stateKey: STATE_KEYS.hookProfile },
      profile,
    );
    await ctx.state.set(
      { scopeKind: "instance", stateKey: STATE_KEYS.installedHarnesses },
      reports.map((r) => ({ harness: r.harness, hooks: r.hooksWritten, skills: r.skillsWritten })),
    );
    return { reports };
  });

  ctx.actions.register("install-prompt-augmentations", async () => {
    const config = (await ctx.config.get()) as { promptAugmentationEnabled?: boolean };
    if (config.promptAugmentationEnabled === false) {
      return { skipped: true };
    }
    const result = await deps.augmenter.installToHome();
    return { written: result.written, skipped: result.skipped };
  });

  ctx.actions.register("set-hook-profile", async (params) => {
    const value = String(params.profile ?? "");
    if (!(HOOK_PROFILES as readonly string[]).includes(value)) {
      throw new Error(`unknown profile: ${value}`);
    }
    await ctx.state.set(
      { scopeKind: "instance", stateKey: STATE_KEYS.hookProfile },
      value as HookProfile,
    );
    return { profile: value };
  });

  ctx.actions.register("run-skill", async (params) => {
    const id = String(params.id ?? "");
    if (!id) throw new Error("id is required");
    const skill = await deps.loader.get(id);
    if (!skill) throw new Error(`skill ${id} not found`);
    return { id: skill.id, title: skill.title, body: skill.body };
  });

  ctx.actions.register("invoke-agent", async (params) => {
    const companyId = String(params.companyId ?? "");
    const agentId = String(params.agentId ?? "");
    const prompt = String(params.prompt ?? "");
    if (!companyId || !agentId || !prompt) {
      throw new Error("companyId, agentId, prompt required");
    }
    return ctx.agents.invoke(agentId, companyId, {
      prompt,
      reason: "everything-code dashboard action",
    });
  });
}

function parseHarnesses(input: unknown): SupportedHarness[] {
  if (!Array.isArray(input)) return ["claude-code"];
  const out: SupportedHarness[] = [];
  for (const value of input) {
    if (typeof value !== "string") continue;
    if ((SUPPORTED_HARNESSES as readonly string[]).includes(value)) {
      out.push(value as SupportedHarness);
    }
  }
  return out.length > 0 ? out : ["claude-code"];
}
