#!/usr/bin/env node
// Summarizes the Claude Code transcripts of orc-pack runs for /retro: token usage per session
// and per agent type, the costliest dispatches, tool errors, likely retries, and a compact
// timeline of each session's tool calls. It reads transcripts only and writes to <outDir>.
//
// Usage: node usage.mjs <repoRoot> <outDir> [--since <ISO date>] [--session <id>]...
//
// Transcripts live in ~/.claude/projects/<slug>/, where <slug> is the session's working
// directory with every character outside [A-Za-z0-9] replaced by "-". Worktree sessions
// (<slug>--claude-worktrees-*) are included. Each assistant API response can span several
// transcript lines that repeat one usage block, so usage is counted once per message id.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ORC_SKILLS = [
  "orc",
  "orc-loop",
  "orc-loop-iter",
  "orc-rush",
  "orc-pack",
  "orc-review",
  "deep-review",
];
const TIMELINE_CAP = 400;

const args = process.argv.slice(2);
const repoRoot = args[0];
const outDir = args[1];
if (!repoRoot || !outDir) {
  console.error(
    "Usage: node usage.mjs <repoRoot> <outDir> [--since <ISO date>] [--session <id>]...",
  );
  process.exit(2);
}
let since = null;
const onlySessions = [];
for (let i = 2; i < args.length; i++) {
  if (args[i] === "--since") since = new Date(args[++i]);
  else if (args[i] === "--session") onlySessions.push(args[++i]);
}

const projectsDir = path.join(os.homedir(), ".claude", "projects");
const slug = path.resolve(repoRoot).replace(/[^A-Za-z0-9]/g, "-");
const projectDirs = fs.existsSync(projectsDir)
  ? fs
      .readdirSync(projectsDir)
      .filter((d) => d === slug || d.startsWith(`${slug}--claude-worktrees-`))
      .map((d) => path.join(projectsDir, d))
  : [];
if (projectDirs.length === 0) {
  console.error(`No transcripts found for ${slug} under ${projectsDir}`);
  process.exit(1);
}

function readLines(file) {
  const out = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // A line cut off by a crash or a session still writing; skip it.
    }
  }
  return out;
}

function emptyUsage() {
  return {
    requests: 0,
    input: 0,
    cacheWrite5m: 0,
    cacheWrite1h: 0,
    cacheRead: 0,
    output: 0,
    peakContext: 0,
  };
}

// Relative cost in input-token units: cache writes cost 1.25x (5 minutes) or 2x (1 hour),
// cache reads 0.1x, and output 5x. Compare it within one model; models are priced differently.
function weighted(u) {
  return Math.round(
    u.input +
      1.25 * u.cacheWrite5m +
      2 * u.cacheWrite1h +
      0.1 * u.cacheRead +
      5 * u.output,
  );
}

function addUsage(total, lines) {
  const seen = new Set();
  for (const o of lines) {
    if (o.type !== "assistant" || !o.message?.usage) continue;
    const id = o.message.id ?? o.requestId ?? o.uuid;
    if (seen.has(id)) continue;
    seen.add(id);
    const u = o.message.usage;
    const write1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    const write5m = (u.cache_creation_input_tokens ?? 0) - write1h;
    total.requests += 1;
    total.input += u.input_tokens ?? 0;
    total.cacheWrite5m += Math.max(0, write5m);
    total.cacheWrite1h += write1h;
    total.cacheRead += u.cache_read_input_tokens ?? 0;
    total.output += u.output_tokens ?? 0;
    const context =
      (u.input_tokens ?? 0) +
      (u.cache_creation_input_tokens ?? 0) +
      (u.cache_read_input_tokens ?? 0);
    total.peakContext = Math.max(total.peakContext, context);
  }
  return total;
}

function contentBlocks(o) {
  const c = o.message?.content;
  return Array.isArray(c) ? c : [];
}

function textOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => c.text ?? "").join(" ");
  return "";
}

function oneLine(s, n = 120) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
}

function skillsInvoked(lines) {
  const found = new Set();
  for (const o of lines) {
    for (const c of contentBlocks(o)) {
      if (c.type === "tool_use" && c.name === "Skill" && c.input?.skill) {
        found.add(String(c.input.skill).replace(/^.*:/, ""));
      }
    }
    if (o.type === "user") {
      for (const m of textOf(o.message?.content).matchAll(
        /<command-name>\/?([\w:-]+)<\/command-name>/g,
      )) {
        found.add(m[1].replace(/^.*:/, ""));
      }
    }
  }
  return [...found];
}

function statusLines(lines) {
  const re =
    /^\**\s*(LOOP (FINISHED|NOT FINISHED|NOT STARTED|STOPPED)|FINISHED|NOT FINISHED)\b.*$/gm;
  const found = [];
  for (const o of lines) {
    if (o.type !== "assistant") continue;
    for (const c of contentBlocks(o)) {
      if (c.type === "text")
        for (const m of c.text.matchAll(re)) found.push(oneLine(m[0], 160));
    }
  }
  return found;
}

function summarizeSubagents(sessionDir) {
  const dir = path.join(sessionDir, "subagents");
  const byToolUse = new Map();
  if (!fs.existsSync(dir)) return byToolUse;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
    const base = f.replace(/\.jsonl$/, "");
    const metaPath = path.join(dir, `${base}.meta.json`);
    const meta = fs.existsSync(metaPath)
      ? JSON.parse(fs.readFileSync(metaPath, "utf8"))
      : {};
    const lines = readLines(path.join(dir, f));
    const usage = addUsage(emptyUsage(), lines);
    const times = lines
      .map((o) => o.timestamp)
      .filter(Boolean)
      .sort();
    let toolCalls = 0;
    let errors = 0;
    let model = meta.model ?? null;
    for (const o of lines) {
      if (o.type === "assistant" && o.message?.model) model = o.message.model;
      for (const c of contentBlocks(o)) {
        if (c.type === "tool_use") toolCalls += 1;
        if (c.type === "tool_result" && c.is_error) errors += 1;
      }
    }
    const entry = {
      agentId: base,
      agentType: meta.agentType ?? "unknown",
      description: meta.description ?? "",
      model,
      usage,
      weighted: weighted(usage),
      seconds:
        times.length > 1
          ? Math.round((new Date(times.at(-1)) - new Date(times[0])) / 1000)
          : 0,
      toolCalls,
      errors,
    };
    byToolUse.set(meta.toolUseId ?? base, entry);
  }
  return byToolUse;
}

function summarizeSession(file) {
  const id = path.basename(file, ".jsonl");
  const lines = readLines(file);
  const times = lines
    .map((o) => o.timestamp)
    .filter(Boolean)
    .sort();
  if (times.length === 0) return null;
  if (onlySessions.length > 0 && !onlySessions.includes(id)) return null;
  if (since && new Date(times.at(-1)) < since) return null;
  const skills = skillsInvoked(lines);
  if (onlySessions.length === 0 && !skills.some((s) => ORC_SKILLS.includes(s)))
    return null;

  const subagents = summarizeSubagents(path.join(path.dirname(file), id));
  const main = addUsage(emptyUsage(), lines);
  const errorsById = new Map();
  for (const o of lines) {
    for (const c of contentBlocks(o)) {
      if (c.type === "tool_result" && c.is_error)
        errorsById.set(c.tool_use_id, oneLine(textOf(c.content), 160));
    }
  }

  const timeline = [];
  const dispatches = [];
  let wakeups = 0;
  let compactions = 0;
  let models = new Set();
  for (const o of lines) {
    if (o.type === "system" && /compact/i.test(o.subtype ?? ""))
      compactions += 1;
    if (o.isCompactSummary) compactions += 1;
    if (o.type === "assistant" && o.message?.model) models.add(o.message.model);
    for (const c of contentBlocks(o)) {
      if (c.type !== "tool_use") continue;
      const t = (o.timestamp ?? "").slice(11, 19);
      const err = errorsById.has(c.id) ? ` ERROR: ${errorsById.get(c.id)}` : "";
      let what;
      if (c.name === "Agent" || c.name === "Task") {
        const sub = subagents.get(c.id);
        const type =
          c.input?.subagent_type ?? sub?.agentType ?? "general-purpose";
        const d = {
          time: o.timestamp,
          agentType: type,
          description: c.input?.description ?? sub?.description ?? "",
          modelOverride: c.input?.model ?? null,
          effortOverride: c.input?.effort ?? null,
          ...(sub ?? {
            usage: emptyUsage(),
            weighted: 0,
            seconds: 0,
            toolCalls: 0,
            errors: 0,
            model: null,
          }),
        };
        dispatches.push(d);
        what = `Agent ${type}${d.modelOverride ? ` (${d.modelOverride})` : ""}: ${oneLine(d.description, 80)} [${d.weighted.toLocaleString()} wtok, ${d.seconds}s]`;
      } else if (c.name === "Skill") {
        what = `Skill ${c.input?.skill} ${oneLine(c.input?.args, 60)}`;
      } else if (c.name === "ScheduleWakeup") {
        wakeups += 1;
        what = `ScheduleWakeup ${c.input?.delaySeconds ?? ""}s ${oneLine(c.input?.reason, 60)}`;
      } else {
        what = `${c.name} ${oneLine(c.input?.description ?? c.input?.command ?? c.input?.file_path ?? c.input?.pattern ?? "", 90)}`;
      }
      timeline.push(`${t} ${what}${err}`);
    }
  }

  const retries = [];
  const seen = new Map();
  for (const d of dispatches) {
    const key = `${d.agentType}|${d.description}`;
    if (seen.has(key)) retries.push(key);
    seen.set(key, true);
  }

  return {
    id,
    file,
    start: times[0],
    end: times.at(-1),
    minutes: Math.round((new Date(times.at(-1)) - new Date(times[0])) / 60000),
    skills,
    models: [...models],
    status: statusLines(lines),
    main: { usage: main, weighted: weighted(main) },
    subagentWeighted: dispatches.reduce((n, d) => n + d.weighted, 0),
    dispatchCount: dispatches.length,
    wakeups,
    compactions,
    toolErrors: [...errorsById.values()],
    repeatedDispatches: retries,
    dispatches,
    timeline,
  };
}

const sessions = [];
for (const dir of projectDirs) {
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
    const s = summarizeSession(path.join(dir, f));
    if (s) sessions.push(s);
  }
}
sessions.sort((a, b) => a.start.localeCompare(b.start));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "usage.json"),
  JSON.stringify(sessions, null, 2),
);

const fmt = (n) => n.toLocaleString("en-US");
const md = [];
md.push(`# Run usage: ${sessions.length} session(s)`, "");
md.push(
  "Weighted tokens (wtok) are input-token units: cache writes 1.25x or 2x, cache reads 0.1x, output 5x. Compare within one model.",
  "",
);
md.push("## Sessions", "");
md.push(
  "| Session | Start | Minutes | Skills | Main wtok | Peak context | Subagent wtok | Dispatches | Wakeups | Compactions | Tool errors |",
);
md.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const s of sessions) {
  md.push(
    `| ${s.id.slice(0, 8)} | ${s.start.slice(0, 16)} | ${s.minutes} | ${s.skills.join(", ")} | ${fmt(s.main.weighted)} | ${fmt(s.main.usage.peakContext)} | ${fmt(s.subagentWeighted)} | ${s.dispatchCount} | ${s.wakeups} | ${s.compactions} | ${s.toolErrors.length} |`,
  );
}

const byType = new Map();
for (const s of sessions) {
  for (const d of s.dispatches) {
    const key = `${d.agentType}|${d.model ?? "?"}`;
    const t = byType.get(key) ?? {
      agentType: d.agentType,
      model: d.model ?? "?",
      count: 0,
      weighted: 0,
      output: 0,
      max: 0,
      seconds: 0,
      errors: 0,
    };
    t.count += 1;
    t.weighted += d.weighted;
    t.output += d.usage.output;
    t.max = Math.max(t.max, d.weighted);
    t.seconds += d.seconds;
    t.errors += d.errors;
    byType.set(key, t);
  }
}
md.push("", "## By agent type", "");
md.push(
  "| Agent | Model | Dispatches | Total wtok | Mean wtok | Max wtok | Output tokens | Minutes | Tool errors |",
);
md.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const t of [...byType.values()].sort((a, b) => b.weighted - a.weighted)) {
  md.push(
    `| ${t.agentType} | ${t.model} | ${t.count} | ${fmt(t.weighted)} | ${fmt(Math.round(t.weighted / t.count))} | ${fmt(t.max)} | ${fmt(t.output)} | ${Math.round(t.seconds / 60)} | ${t.errors} |`,
  );
}

const all = sessions.flatMap((s) =>
  s.dispatches.map((d) => ({ ...d, session: s.id.slice(0, 8) })),
);
md.push("", "## Costliest dispatches", "");
for (const d of all.sort((a, b) => b.weighted - a.weighted).slice(0, 15)) {
  md.push(
    `- ${d.session} ${d.time?.slice(11, 16)} ${d.agentType} (${d.model ?? "?"}): ${oneLine(d.description, 80)} - ${fmt(d.weighted)} wtok, ${d.toolCalls} tool calls, ${d.seconds}s`,
  );
}

md.push("", "## Signals", "");
for (const s of sessions) {
  md.push(`### ${s.id.slice(0, 8)}`, "");
  md.push(`- Status: ${s.status.length ? s.status.join(" / ") : "none found"}`);
  md.push(`- Models: ${s.models.join(", ") || "unknown"}`);
  if (s.repeatedDispatches.length)
    md.push(
      `- Repeated dispatches (same agent and description): ${s.repeatedDispatches.length}: ${[
        ...new Set(s.repeatedDispatches),
      ]
        .slice(0, 10)
        .map((k) => k.replace("|", ": "))
        .join("; ")}`,
    );
  if (s.toolErrors.length)
    md.push(
      `- Tool errors (first 10): ${s.toolErrors
        .slice(0, 10)
        .map((e) => `\`${e}\``)
        .join("; ")}`,
    );
  md.push(`- Timeline: timeline-${s.id.slice(0, 8)}.md`, "");
  const tl =
    s.timeline.length > TIMELINE_CAP
      ? [
          ...s.timeline.slice(0, TIMELINE_CAP),
          `... ${s.timeline.length - TIMELINE_CAP} more tool calls`,
        ]
      : s.timeline;
  fs.writeFileSync(
    path.join(outDir, `timeline-${s.id.slice(0, 8)}.md`),
    `# Timeline ${s.id}\n\nTranscript: ${s.file}\n\n${tl.join("\n")}\n`,
  );
}

fs.writeFileSync(path.join(outDir, "usage.md"), `${md.join("\n")}\n`);
console.log(
  `Wrote ${path.join(outDir, "usage.md")} for ${sessions.length} session(s).`,
);
