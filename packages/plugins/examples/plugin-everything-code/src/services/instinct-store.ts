import type { PluginContext, PluginEntityRecord } from "@paperclipai/plugin-sdk";
import { ENTITY_TYPES } from "../constants.js";

export interface InstinctRecord {
  id: string;
  pattern: string;
  source: string;
  confidence: number;
  status: "proposed" | "confirmed" | "promoted";
  hits: number;
  createdAt: string;
  updatedAt: string;
}

export class InstinctStore {
  constructor(private readonly ctx: PluginContext) {}

  async list(companyId: string): Promise<InstinctRecord[]> {
    const records = await this.ctx.entities.list({
      entityType: ENTITY_TYPES.instinct,
      scopeKind: "company",
      scopeId: companyId,
    });
    return records.map(toInstinct);
  }

  async upsert(
    companyId: string,
    instinct: Omit<InstinctRecord, "id" | "createdAt" | "updatedAt"> & { externalId?: string },
  ): Promise<InstinctRecord> {
    const externalId = instinct.externalId ?? hash(instinct.pattern);
    const record = await this.ctx.entities.upsert({
      entityType: ENTITY_TYPES.instinct,
      scopeKind: "company",
      scopeId: companyId,
      externalId,
      title: instinct.pattern.slice(0, 80),
      status: instinct.status,
      data: {
        pattern: instinct.pattern,
        source: instinct.source,
        confidence: instinct.confidence,
        hits: instinct.hits,
      },
    });
    return toInstinct(record);
  }

  async promoteAboveThreshold(companyId: string, threshold: number): Promise<InstinctRecord[]> {
    const all = await this.list(companyId);
    const promoted: InstinctRecord[] = [];
    for (const inst of all) {
      if (inst.confidence >= threshold && inst.status !== "promoted") {
        const next = await this.upsert(companyId, {
          pattern: inst.pattern,
          source: inst.source,
          confidence: inst.confidence,
          hits: inst.hits,
          status: "promoted",
        });
        promoted.push(next);
      }
    }
    return promoted;
  }
}

function toInstinct(record: PluginEntityRecord): InstinctRecord {
  const data = record.data ?? {};
  return {
    id: record.id,
    pattern: typeof data.pattern === "string" ? data.pattern : record.title ?? "",
    source: typeof data.source === "string" ? data.source : "unknown",
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    status: (record.status as InstinctRecord["status"]) ?? "proposed",
    hits: typeof data.hits === "number" ? data.hits : 1,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return `inst-${Math.abs(h).toString(36)}`;
}
