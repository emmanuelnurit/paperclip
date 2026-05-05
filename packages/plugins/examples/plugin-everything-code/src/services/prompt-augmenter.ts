import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { SkillLoader } from "./skill-loader.js";

export interface AugmentResult {
  written: string[];
  skipped: string[];
}

const PROMPT_FILES: ReadonlyArray<{ slug: string; target: string }> = [
  { slug: "heartbeat-augment.md", target: "everything-code-heartbeat.md" },
  { slug: "checkout-augment.md", target: "everything-code-checkout.md" },
  { slug: "comment-reply-augment.md", target: "everything-code-comment-reply.md" },
  { slug: "pr-review-augment.md", target: "everything-code-pr-review.md" },
];

export class PromptAugmenter {
  constructor(private readonly loader: SkillLoader) {}

  async installToHome(): Promise<AugmentResult> {
    const homeReferences = path.join(os.homedir(), ".claude", "skills", "paperclip", "references");
    return this.installToReferencesDir(homeReferences);
  }

  async installToReferencesDir(referencesDir: string): Promise<AugmentResult> {
    const written: string[] = [];
    const skipped: string[] = [];
    await fs.mkdir(referencesDir, { recursive: true });
    for (const file of PROMPT_FILES) {
      const body = await this.loader.getCategoryFile("prompts", file.slug);
      if (!body) {
        skipped.push(file.slug);
        continue;
      }
      const dest = path.join(referencesDir, file.target);
      await fs.writeFile(dest, body, "utf8");
      written.push(dest);
    }
    return { written, skipped };
  }
}
