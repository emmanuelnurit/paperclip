import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface SkillSummary {
  id: string;
  category: string;
  filename: string;
  title: string;
  description: string;
}

export interface Skill extends SkillSummary {
  body: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveContentRoot(): string {
  return path.resolve(__dirname, "..", "content");
}

function parseFrontmatter(raw: string): { title: string; description: string; body: string } {
  if (!raw.startsWith("---")) {
    const firstLine = raw.split(/\r?\n/, 1)[0]?.replace(/^#\s*/, "") ?? "";
    return { title: firstLine, description: "", body: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { title: "", description: "", body: raw };
  const block = raw.slice(3, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  let title = "";
  let description = "";
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    if (m[1] === "title") title = m[2].replace(/^["']|["']$/g, "");
    if (m[1] === "description") description = m[2].replace(/^["']|["']$/g, "");
  }
  return { title, description, body };
}

export class SkillLoader {
  private cache: Map<string, Skill> = new Map();
  private indexCache: SkillSummary[] | null = null;
  private readonly root: string;

  constructor(root?: string) {
    this.root = root ?? resolveContentRoot();
  }

  async list(): Promise<SkillSummary[]> {
    if (this.indexCache) return this.indexCache;
    const skillsRoot = path.join(this.root, "skills");
    const out: SkillSummary[] = [];
    let categories: string[] = [];
    try {
      const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
      categories = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      this.indexCache = [];
      return [];
    }
    for (const category of categories) {
      const dir = path.join(skillsRoot, category);
      const files = await fs.readdir(dir);
      for (const filename of files) {
        if (!filename.endsWith(".md")) continue;
        const id = `${category}/${filename.replace(/\.md$/, "")}`;
        const raw = await fs.readFile(path.join(dir, filename), "utf8");
        const { title, description } = parseFrontmatter(raw);
        out.push({
          id,
          category,
          filename,
          title: title || filename.replace(/\.md$/, ""),
          description,
        });
      }
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    this.indexCache = out;
    return out;
  }

  async get(id: string): Promise<Skill | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const [category, ...rest] = id.split("/");
    if (!category || rest.length === 0) return null;
    const filename = `${rest.join("/")}.md`;
    const filePath = path.join(this.root, "skills", category, filename);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const { title, description, body } = parseFrontmatter(raw);
      const skill: Skill = {
        id,
        category,
        filename,
        title: title || filename.replace(/\.md$/, ""),
        description,
        body,
      };
      this.cache.set(id, skill);
      return skill;
    } catch {
      return null;
    }
  }

  async getCategoryFile(category: "agents" | "rules" | "contexts" | "prompts", filename: string): Promise<string | null> {
    const filePath = path.join(this.root, category, filename);
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      return null;
    }
  }

  contentRoot(): string {
    return this.root;
  }
}
