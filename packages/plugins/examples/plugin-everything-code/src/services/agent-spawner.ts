import type { PluginContext } from "@paperclipai/plugin-sdk";

export interface SpawnResult {
  sessionId: string;
  runId: string;
  agentId: string;
}

export class AgentSpawner {
  constructor(private readonly ctx: PluginContext) {}

  async spawn(opts: {
    companyId: string;
    agentId: string;
    prompt: string;
    reason?: string;
    onEvent?: (chunk: string) => void;
  }): Promise<SpawnResult> {
    const session = await this.ctx.agents.sessions.create(opts.agentId, opts.companyId, {
      reason: opts.reason ?? "everything-code spawn",
    });
    const send = await this.ctx.agents.sessions.sendMessage(session.sessionId, opts.companyId, {
      prompt: opts.prompt,
      reason: opts.reason,
      onEvent: opts.onEvent
        ? (event) => {
            if (event.eventType === "chunk" && event.message) {
              opts.onEvent!(event.message);
            }
          }
        : undefined,
    });
    return { sessionId: session.sessionId, runId: send.runId, agentId: opts.agentId };
  }

  async closeAll(companyId: string, agentId: string): Promise<void> {
    const sessions = await this.ctx.agents.sessions.list(agentId, companyId);
    for (const session of sessions) {
      try {
        await this.ctx.agents.sessions.close(session.sessionId, companyId);
      } catch {
        // best-effort cleanup
      }
    }
  }
}
