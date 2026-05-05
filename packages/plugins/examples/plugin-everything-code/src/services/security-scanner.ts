import { promises as fs } from "node:fs";
import path from "node:path";

export interface SecurityFinding {
  severity: "low" | "medium" | "high" | "critical";
  category: "secret" | "prompt-injection" | "config" | "permission";
  file: string;
  line?: number;
  message: string;
}

export interface SecurityReport {
  score: number;
  findings: SecurityFinding[];
  scannedFiles: number;
}

const SECRET_PATTERNS: Array<[RegExp, SecurityFinding["severity"], string]> = [
  [/AKIA[0-9A-Z]{16}/, "critical", "AWS access key id"],
  [/sk-[A-Za-z0-9]{20,}/, "critical", "OpenAI / API key prefix sk-"],
  [/ghp_[A-Za-z0-9]{20,}/, "critical", "GitHub personal token"],
  [/xox[abp]-[A-Za-z0-9-]{10,}/, "high", "Slack token"],
  [/-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----/, "critical", "Private key"],
  [/(api[_-]?key|secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i, "high", "Hardcoded api key/secret"],
];

const INJECTION_PATTERNS: Array<[RegExp, SecurityFinding["severity"], string]> = [
  [/ignore (all )?previous instructions/i, "high", "Prompt-injection-style instruction"],
  [/system prompt/i, "medium", "Mention of system prompt — review context"],
  [/exfiltrate|leak|dump (the )?(env|secrets)/i, "high", "Data exfiltration phrasing"],
];

const CONFIG_FILES = [
  "CLAUDE.md",
  "AGENTS.md",
  ".claude/settings.json",
  ".claude/settings.local.json",
  ".cursor/rules",
  ".codex/agents.md",
  ".mcp.json",
];

export class SecurityScanner {
  async scan(workspacePath: string): Promise<SecurityReport> {
    const findings: SecurityFinding[] = [];
    let scanned = 0;
    for (const rel of CONFIG_FILES) {
      const full = path.join(workspacePath, rel);
      const stat = await safeStat(full);
      if (!stat) continue;
      if (stat.isDirectory()) {
        const sub = await safeReaddir(full);
        for (const file of sub) {
          if (!file.endsWith(".md") && !file.endsWith(".json") && !file.endsWith(".mdc")) continue;
          scanned += await this.scanFile(path.join(full, file), findings);
        }
      } else {
        scanned += await this.scanFile(full, findings);
      }
    }
    const score = computeScore(findings);
    return { score, findings, scannedFiles: scanned };
  }

  private async scanFile(filePath: string, findings: SecurityFinding[]): Promise<number> {
    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf8");
    } catch {
      return 0;
    }
    const lines = raw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const [pat, severity, message] of SECRET_PATTERNS) {
        if (pat.test(line)) {
          findings.push({
            severity,
            category: "secret",
            file: filePath,
            line: i + 1,
            message,
          });
        }
      }
      for (const [pat, severity, message] of INJECTION_PATTERNS) {
        if (pat.test(line)) {
          findings.push({
            severity,
            category: "prompt-injection",
            file: filePath,
            line: i + 1,
            message,
          });
        }
      }
    }
    return 1;
  }
}

function computeScore(findings: SecurityFinding[]): number {
  let penalty = 0;
  for (const f of findings) {
    penalty += f.severity === "critical" ? 30 : f.severity === "high" ? 15 : f.severity === "medium" ? 6 : 2;
  }
  return Math.max(0, 100 - penalty);
}

async function safeStat(p: string) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function safeReaddir(p: string): Promise<string[]> {
  try {
    return await fs.readdir(p);
  } catch {
    return [];
  }
}
