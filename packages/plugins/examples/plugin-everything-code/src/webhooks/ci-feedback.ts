import type { PluginContext, PluginWebhookInput } from "@paperclipai/plugin-sdk";
import { ENTITY_TYPES, STATE_KEYS } from "../constants.js";

export async function handleCiFeedback(
  ctx: PluginContext,
  input: PluginWebhookInput,
): Promise<{ status: number; body: unknown }> {
  let payload: unknown = input.parsedBody ?? null;
  if (payload === null && input.rawBody) {
    try {
      payload = JSON.parse(input.rawBody);
    } catch {
      return { status: 400, body: { error: "invalid JSON payload" } };
    }
  }

  if (!payload || typeof payload !== "object") {
    return { status: 400, body: { error: "missing payload" } };
  }

  const obj = payload as Record<string, unknown>;
  const status = typeof obj.status === "string" ? obj.status : "unknown";
  const projectId = typeof obj.projectId === "string" ? obj.projectId : null;
  const companyId = typeof obj.companyId === "string" ? obj.companyId : null;
  const log = typeof obj.log === "string" ? obj.log.slice(0, 4000) : "";
  const buildUrl = typeof obj.url === "string" ? obj.url : null;

  if (!companyId) {
    return { status: 400, body: { error: "companyId is required" } };
  }

  await ctx.state.set(
    projectId
      ? { scopeKind: "project", scopeId: projectId, stateKey: STATE_KEYS.lastCiBuild }
      : { scopeKind: "company", scopeId: companyId, stateKey: STATE_KEYS.lastCiBuild },
    { status, url: buildUrl, receivedAt: new Date().toISOString() },
  );

  await ctx.entities.upsert({
    entityType: ENTITY_TYPES.buildFailure,
    scopeKind: projectId ? "project" : "company",
    scopeId: projectId ?? companyId,
    externalId: typeof obj.runId === "string" ? obj.runId : `ci-${Date.now()}`,
    title: `CI ${status}${buildUrl ? ` — ${buildUrl}` : ""}`,
    status,
    data: { status, url: buildUrl, log },
  });

  await ctx.activity.log({
    companyId,
    message: `CI ${status} received from webhook`,
    entityType: "ci-build",
    entityId: typeof obj.runId === "string" ? obj.runId : undefined,
    metadata: { url: buildUrl ?? undefined, projectId: projectId ?? undefined },
  });

  const config = (await ctx.config.get()) as { ciFeedbackAutoFix?: boolean };
  if (status === "failure" && config.ciFeedbackAutoFix && projectId) {
    try {
      await ctx.issues.create({
        companyId,
        projectId,
        title: `CI failure${buildUrl ? `: ${buildUrl}` : ""}`,
        description: log
          ? `Auto-created from CI feedback webhook.\n\nFailure log:\n\n\`\`\`\n${log}\n\`\`\``
          : "Auto-created from CI feedback webhook.",
        priority: "high",
      });
    } catch (err) {
      ctx.logger.warn("auto-create issue failed", { err: String(err) });
    }
  }

  return { status: 200, body: { ok: true } };
}
