import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  useHostContext,
  usePluginAction,
  usePluginData,
  type PluginCommentContextMenuItemProps,
  type PluginDetailTabProps,
  type PluginPageProps,
  type PluginProjectSidebarItemProps,
  type PluginSettingsPageProps,
  type PluginSidebarProps,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";
import { HOOK_PROFILES, SUPPORTED_HARNESSES } from "../constants.js";

const palette = {
  bg: "#0d1117",
  panel: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#58a6ff",
  warn: "#d29922",
  ok: "#3fb950",
  bad: "#f85149",
};

const baseShell: CSSProperties = {
  background: palette.bg,
  color: palette.text,
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  padding: 16,
  minHeight: 200,
};

const card: CSSProperties = {
  background: palette.panel,
  border: `1px solid ${palette.border}`,
  borderRadius: 8,
  padding: 12,
};

const buttonStyle: CSSProperties = {
  background: palette.accent,
  border: 0,
  color: "#000",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 600,
};

const subtle: CSSProperties = { color: palette.muted, fontSize: 12 };

interface SkillSummary {
  id: string;
  category: string;
  title: string;
  description: string;
}
interface AgentItem {
  id: string;
  filename: string;
  title: string;
}
interface InstinctItem {
  id: string;
  pattern: string;
  source: string;
  confidence: number;
  status: string;
  hits: number;
}
interface OverviewData {
  skillCount: number;
  instinctCount: number;
  promotedInstincts: number;
  quality: { score?: number } | null;
  lastBuild: { status?: string; url?: string | null } | null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  const color =
    value === "good" || value === "success" || value === "ok"
      ? palette.ok
      : value === "warning"
        ? palette.warn
        : value === "critical" || value === "failure"
          ? palette.bad
          : palette.muted;
  return (
    <span style={{ color, fontWeight: 600 }}>{value ?? "—"}</span>
  );
}

export function EverythingCodePage(_props: PluginPageProps) {
  const ctx = useHostContext();
  const skills = usePluginData<{ skills: SkillSummary[] }>("skills-catalog", {});
  const agents = usePluginData<{ agents: AgentItem[] }>("agents-catalog", {});
  const instincts = usePluginData<{ instincts: InstinctItem[] }>("instincts", {
    companyId: ctx.companyId,
  });
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    if (!skills.data) return [];
    if (!filter) return skills.data.skills;
    const q = filter.toLowerCase();
    return skills.data.skills.filter(
      (s) => s.id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q),
    );
  }, [skills.data, filter]);

  return (
    <div style={baseShell}>
      <h2 style={{ marginTop: 0 }}>Everything Code</h2>
      <p style={subtle}>
        Skills, agents, tools, hooks installer and prompt augmentations covering modern web languages plus Symfony and Thelia.
      </p>

      <Section title={`Skills (${skills.data?.skills.length ?? 0})`}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter skills…"
          style={{
            width: "100%",
            padding: 6,
            background: palette.bg,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        {skills.loading && <p style={subtle}>loading…</p>}
        {skills.error && <p style={{ color: palette.bad }}>{skills.error.message}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
          {filtered.map((skill) => (
            <div key={skill.id} style={{ ...card, padding: 8 }}>
              <div style={{ fontWeight: 600 }}>{skill.title}</div>
              <div style={subtle}>{skill.id}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{skill.description}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Agents (${agents.data?.agents.length ?? 0})`}>
        {agents.loading && <p style={subtle}>loading…</p>}
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {(agents.data?.agents ?? []).slice(0, 30).map((a) => (
            <li key={a.id} style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{a.title}</span>{" "}
              <span style={subtle}>({a.id})</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`Instincts (${instincts.data?.instincts.length ?? 0})`}>
        {(instincts.data?.instincts ?? []).slice(0, 50).map((i) => (
          <div key={i.id} style={{ borderBottom: `1px solid ${palette.border}`, padding: "6px 0" }}>
            <div>{i.pattern}</div>
            <div style={subtle}>
              source: {i.source} · confidence: {i.confidence.toFixed(2)} · hits: {i.hits} · <StatusBadge value={i.status} />
            </div>
          </div>
        ))}
        {instincts.data?.instincts.length === 0 && (
          <p style={subtle}>No instincts yet — run /instinct-extract or wait for the evaluator job.</p>
        )}
      </Section>
    </div>
  );
}

export function EverythingCodeDashboardWidget(_props: PluginWidgetProps) {
  const ctx = useHostContext();
  const overview = usePluginData<OverviewData>("dashboard-overview", { companyId: ctx.companyId });
  return (
    <div style={{ ...card, padding: 12 }}>
      <h4 style={{ margin: 0 }}>Everything Code</h4>
      {overview.loading && <p style={subtle}>loading…</p>}
      {overview.data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <div>
            <div style={subtle}>Skills</div>
            <div>{overview.data.skillCount}</div>
          </div>
          <div>
            <div style={subtle}>Instincts</div>
            <div>
              {overview.data.instinctCount} ({overview.data.promotedInstincts} promoted)
            </div>
          </div>
          <div>
            <div style={subtle}>Quality</div>
            <div>{overview.data.quality?.score ?? "—"}</div>
          </div>
          <div>
            <div style={subtle}>Last CI</div>
            <div>
              <StatusBadge value={overview.data.lastBuild?.status} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EverythingCodeSidebar(_props: PluginSidebarProps) {
  return (
    <a href="/plugins/everything-code" style={{ color: palette.accent, textDecoration: "none" }}>
      Everything Code
    </a>
  );
}

export function EverythingCodeSidebarPanel(_props: PluginSidebarProps) {
  const ctx = useHostContext();
  const overview = usePluginData<OverviewData>("dashboard-overview", { companyId: ctx.companyId });
  return (
    <div style={{ padding: 8, background: palette.panel, color: palette.text }}>
      <div style={{ fontWeight: 600 }}>Everything Code</div>
      <div style={subtle}>{overview.data ? `${overview.data.skillCount} skills` : "loading…"}</div>
    </div>
  );
}

export function EverythingCodeProjectSidebarItem(_props: PluginProjectSidebarItemProps) {
  return (
    <span style={{ color: palette.accent, fontSize: 13 }}>everything-code</span>
  );
}

export function EverythingCodeProjectTab(props: PluginDetailTabProps) {
  const projectId = props.context.entityId;
  const quality = usePluginData<{ score?: number; ecosystem?: string } | null>("project-quality", {
    projectId,
  });
  return (
    <div style={baseShell}>
      <h3 style={{ marginTop: 0 }}>Project quality</h3>
      {quality.loading && <p style={subtle}>loading…</p>}
      {quality.data ? (
        <div>
          <div>
            <strong>Score:</strong> {quality.data.score ?? "—"}
          </div>
          <div>
            <strong>Ecosystem:</strong> {quality.data.ecosystem ?? "unknown"}
          </div>
        </div>
      ) : (
        <p style={subtle}>No quality report yet — run the quality gate tool on this project.</p>
      )}
    </div>
  );
}

export function EverythingCodeIssueTab(props: PluginDetailTabProps) {
  const issueId = props.context.entityId;
  return (
    <div style={baseShell}>
      <h3 style={{ marginTop: 0 }}>Everything Code guidance</h3>
      <p style={subtle}>Issue {issueId}</p>
      <ul>
        <li>Run <code>everything_code__plan</code> to draft a step plan.</li>
        <li>Run <code>everything_code__code_review</code> on the latest diff.</li>
        <li>Run <code>everything_code__verify_loop</code> before declaring done.</li>
      </ul>
    </div>
  );
}

export function EverythingCodeCommentMenuItem(_props: PluginCommentContextMenuItemProps) {
  return <div style={{ padding: "4px 8px" }}>Run /code-review on thread</div>;
}

export function EverythingCodeSettingsPage(_props: PluginSettingsPageProps) {
  const ctx = useHostContext();
  const installAction = usePluginAction("install-harness");
  const promptAction = usePluginAction("install-prompt-augmentations");
  const profileAction = usePluginAction("set-hook-profile");
  const installed = usePluginData<{ harnesses: Array<{ harness: string }> }>("installed-harnesses", {});
  const profileData = usePluginData<{ profile: string }>("hook-profile", {});

  const [profile, setProfile] = useState<string>("standard");
  const [harnesses, setHarnesses] = useState<string[]>(["claude-code"]);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string>("");

  const onInstall = async () => {
    setBusy(true);
    try {
      const result = (await installAction({
        profile,
        harnesses,
        publishSkills: true,
      })) as { reports?: Array<unknown> } | null;
      const reports = result?.reports ?? [];
      setLast(`Installed on ${reports.length} harness(es).`);
    } catch (err) {
      setLast(`Install failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onAugment = async () => {
    setBusy(true);
    try {
      await promptAction({});
      setLast("Prompt augmentations installed.");
    } catch (err) {
      setLast(`Augment failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onProfile = async () => {
    setBusy(true);
    try {
      await profileAction({ profile });
      setLast(`Profile set to ${profile}.`);
    } catch (err) {
      setLast(`Profile change failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={baseShell}>
      <h2 style={{ marginTop: 0 }}>Everything Code Settings</h2>
      <p style={subtle}>Active company: {ctx.companyId ?? "—"}</p>

      <Section title="Hook profile">
        <p style={subtle}>Current: {profileData.data?.profile ?? "—"}</p>
        <select
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          style={{ padding: 4, background: palette.bg, color: palette.text, border: `1px solid ${palette.border}` }}
        >
          {HOOK_PROFILES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button style={{ ...buttonStyle, marginLeft: 8 }} disabled={busy} onClick={onProfile}>
          Apply
        </button>
      </Section>

      <Section title="Install on harness">
        <p style={subtle}>
          Pose les skills, agents, rules et un fichier de hooks dans le dossier du harness sélectionné.
          Aucun changement côté core Paperclip.
        </p>
        {SUPPORTED_HARNESSES.map((h) => (
          <label key={h} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={harnesses.includes(h)}
              onChange={(e) => {
                setHarnesses((current) =>
                  e.target.checked ? [...new Set([...current, h])] : current.filter((x) => x !== h),
                );
              }}
            />{" "}
            {h}
          </label>
        ))}
        <div style={{ marginTop: 8 }}>
          <button style={buttonStyle} disabled={busy} onClick={onInstall}>
            Install harness assets
          </button>{" "}
          <button style={buttonStyle} disabled={busy} onClick={onAugment}>
            Install prompt augmentations
          </button>
        </div>
        {installed.data && installed.data.harnesses.length > 0 && (
          <p style={subtle}>
            Already installed: {installed.data.harnesses.map((h) => h.harness).join(", ")}
          </p>
        )}
      </Section>

      {last && <p style={subtle}>{last}</p>}
    </div>
  );
}
