import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { HookProfile, SupportedHarness } from "../constants.js";
import type { SkillLoader } from "./skill-loader.js";

export interface InstallReport {
  harness: SupportedHarness;
  skillsWritten: number;
  agentsWritten: number;
  rulesWritten: number;
  hooksWritten: boolean;
  warnings: string[];
}

export interface InstallOptions {
  harnesses: SupportedHarness[];
  hookProfile: HookProfile;
  publishSkills: boolean;
  homeOverride?: string;
}

const HOOK_PROFILE_TEMPLATES: Record<HookProfile, unknown> = {
  minimal: {
    description: "everything-code:minimal — notification hooks only",
    hooks: {
      Stop: [
        {
          matcher: ".*",
          command: "echo '[everything-code] heartbeat stopped'",
        },
      ],
    },
  },
  standard: {
    description: "everything-code:standard — format on save + secret scan",
    hooks: {
      PostToolUse: [
        {
          matcher: "Edit|Write",
          command:
            "node -e \"console.log('[everything-code] post-edit hook (run formatter / secret scan here)')\"",
        },
      ],
      Stop: [
        {
          matcher: ".*",
          command: "echo '[everything-code] heartbeat stopped'",
        },
      ],
    },
  },
  strict: {
    description: "everything-code:strict — full quality gate before stop",
    hooks: {
      PreToolUse: [
        {
          matcher: "Bash",
          command:
            "node -e \"console.log('[everything-code] pre-bash audit (deny destructive flags here)')\"",
        },
      ],
      PostToolUse: [
        {
          matcher: "Edit|Write",
          command:
            "node -e \"console.log('[everything-code] post-edit hook (format + lint + scan)')\"",
        },
      ],
      Stop: [
        {
          matcher: ".*",
          command:
            "node -e \"console.log('[everything-code] strict stop — running quality gate')\"",
        },
      ],
    },
  },
};

export class HarnessInstaller {
  constructor(private readonly loader: SkillLoader) {}

  async install(options: InstallOptions): Promise<InstallReport[]> {
    const home = options.homeOverride ?? os.homedir();
    const reports: InstallReport[] = [];
    for (const harness of options.harnesses) {
      reports.push(await this.installOne(home, harness, options));
    }
    return reports;
  }

  private async installOne(
    home: string,
    harness: SupportedHarness,
    options: InstallOptions,
  ): Promise<InstallReport> {
    const layout = harnessLayout(home, harness);
    const report: InstallReport = {
      harness,
      skillsWritten: 0,
      agentsWritten: 0,
      rulesWritten: 0,
      hooksWritten: false,
      warnings: [],
    };

    if (options.publishSkills) {
      report.skillsWritten = await this.copySkills(layout.skillsDir);
      report.agentsWritten = await this.copyDir("agents", layout.agentsDir);
      report.rulesWritten = await this.copyDir("rules", layout.rulesDir, { recursive: true });
    }

    if (layout.hooksFile) {
      const profile = HOOK_PROFILE_TEMPLATES[options.hookProfile];
      await fs.mkdir(path.dirname(layout.hooksFile), { recursive: true });
      await fs.writeFile(layout.hooksFile, JSON.stringify(profile, null, 2), "utf8");
      report.hooksWritten = true;
    } else {
      report.warnings.push(`hooks not supported on harness ${harness}`);
    }
    return report;
  }

  private async copySkills(targetDir: string): Promise<number> {
    const skills = await this.loader.list();
    await fs.mkdir(targetDir, { recursive: true });
    let count = 0;
    for (const summary of skills) {
      const skill = await this.loader.get(summary.id);
      if (!skill) continue;
      const subdir = path.join(targetDir, summary.category);
      await fs.mkdir(subdir, { recursive: true });
      await fs.writeFile(path.join(subdir, summary.filename), skill.body, "utf8");
      count++;
    }
    return count;
  }

  private async copyDir(
    category: "agents" | "rules" | "contexts" | "prompts",
    targetDir: string,
    opts: { recursive?: boolean } = {},
  ): Promise<number> {
    const root = path.join(this.loader.contentRoot(), category);
    let count = 0;
    try {
      await fs.access(root);
    } catch {
      return 0;
    }
    await fs.mkdir(targetDir, { recursive: true });
    const walk = async (src: string, dst: string) => {
      const entries = await fs.readdir(src, { withFileTypes: true });
      for (const entry of entries) {
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) {
          if (!opts.recursive) continue;
          await fs.mkdir(d, { recursive: true });
          await walk(s, d);
        } else if (entry.name.endsWith(".md")) {
          const raw = await fs.readFile(s, "utf8");
          await fs.writeFile(d, raw, "utf8");
          count++;
        }
      }
    };
    await walk(root, targetDir);
    return count;
  }
}

interface HarnessLayout {
  skillsDir: string;
  agentsDir: string;
  rulesDir: string;
  hooksFile: string | null;
}

function harnessLayout(home: string, harness: SupportedHarness): HarnessLayout {
  switch (harness) {
    case "claude-code":
      return {
        skillsDir: path.join(home, ".claude", "skills"),
        agentsDir: path.join(home, ".claude", "agents"),
        rulesDir: path.join(home, ".claude", "rules"),
        hooksFile: path.join(home, ".claude", "hooks", "everything-code.json"),
      };
    case "codex":
      return {
        skillsDir: path.join(home, ".codex", "skills"),
        agentsDir: path.join(home, ".codex", "agents"),
        rulesDir: path.join(home, ".codex", "rules"),
        hooksFile: null,
      };
    case "cursor":
      return {
        skillsDir: path.join(home, ".cursor", "skills"),
        agentsDir: path.join(home, ".cursor", "agents"),
        rulesDir: path.join(home, ".cursor", "rules"),
        hooksFile: null,
      };
    case "opencode":
      return {
        skillsDir: path.join(home, ".opencode", "skills"),
        agentsDir: path.join(home, ".opencode", "agents"),
        rulesDir: path.join(home, ".opencode", "rules"),
        hooksFile: path.join(home, ".opencode", "hooks", "everything-code.json"),
      };
  }
}
