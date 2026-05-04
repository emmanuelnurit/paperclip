import type { PluginContext } from "@paperclipai/plugin-sdk";
import { ENTITY_TYPES, JOB_KEYS, STATE_KEYS } from "../constants.js";
import type { InstinctStore } from "../services/instinct-store.js";

export interface JobDeps {
  instincts: InstinctStore;
}

export function registerAllJobs(ctx: PluginContext, deps: JobDeps): void {
  ctx.jobs.register(JOB_KEYS.instinctEvaluator, async (job) => {
    const config = (await ctx.config.get()) as { enableInstinctLearning?: boolean };
    if (config.enableInstinctLearning === false) {
      ctx.logger.info("instinct evaluator skipped (disabled)", { runId: job.runId });
      return;
    }
    const companies = await ctx.companies.list({ limit: 50 });
    for (const company of companies) {
      const all = await deps.instincts.list(company.id);
      for (const inst of all) {
        const next = Math.min(1, inst.confidence + 0.05 * Math.log1p(inst.hits));
        await deps.instincts.upsert(company.id, {
          pattern: inst.pattern,
          source: inst.source,
          confidence: next,
          hits: inst.hits,
          status: next >= 0.8 ? "confirmed" : inst.status,
        });
      }
    }
  });

  ctx.jobs.register(JOB_KEYS.memoryCompactor, async (job) => {
    ctx.logger.info("memory compactor running", { runId: job.runId });
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
    const runs = await ctx.entities.list({
      entityType: ENTITY_TYPES.multiAgentRun,
      limit: 1000,
    });
    let trimmed = 0;
    for (const run of runs) {
      if (new Date(run.updatedAt).getTime() < cutoff && run.status !== "running") {
        await ctx.entities.upsert({
          entityType: ENTITY_TYPES.multiAgentRun,
          scopeKind: run.scopeKind,
          scopeId: run.scopeId ?? undefined,
          externalId: run.externalId ?? undefined,
          title: run.title ?? undefined,
          status: "compacted",
          data: { compactedAt: new Date().toISOString() },
        });
        trimmed++;
      }
    }
    await ctx.metrics.write("memory.compacted", trimmed);
  });

  ctx.jobs.register(JOB_KEYS.qualityRollup, async (job) => {
    ctx.logger.info("quality rollup running", { runId: job.runId });
    const companies = await ctx.companies.list({ limit: 50 });
    for (const company of companies) {
      const projects = await ctx.projects.list({ companyId: company.id, limit: 50 });
      let total = 0;
      let count = 0;
      for (const project of projects) {
        const stored = (await ctx.state.get({
          scopeKind: "project",
          scopeId: project.id,
          stateKey: STATE_KEYS.qualityScore,
        })) as { score?: number } | null;
        if (stored && typeof stored.score === "number") {
          total += stored.score;
          count++;
        }
      }
      if (count > 0) {
        const avg = Math.round(total / count);
        await ctx.metrics.write("quality.average", avg, { companyId: company.id });
        await ctx.state.set(
          {
            scopeKind: "company",
            scopeId: company.id,
            stateKey: STATE_KEYS.qualityScore,
          },
          { score: avg, updatedAt: new Date().toISOString(), projectsScored: count },
        );
      }
    }
  });
}
