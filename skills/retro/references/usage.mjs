#!/usr/bin/env node
// Summarizes the Claude Code transcripts of orc-pack runs for /retro: cost, tokens, and active
// time per session and per closed issue, token usage per agent type, the costliest dispatches,
// tool errors, likely retries, and a compact timeline of each session's tool calls. It reads
// transcripts (and the optional closed-issue list) only and writes to <outDir>.
//
// Usage: node usage.mjs <repoRoot> <outDir> [--since <ISO date>] [--session <id>]...
//          [--closed <file>]
//
// --closed names a JSON file from `gh issue list --state closed --json number,stateReason`.
// With it, an issue counts toward the per-issue figures only when it closed as completed.
//
// Transcripts live in ~/.claude/projects/<slug>/, where <slug> is the session's working
// directory with every character outside [A-Za-z0-9] replaced by "-". Worktree sessions
// (<slug>--claude-worktrees-*) are included. Each assistant API response can span several
// transcript lines that repeat one usage block, so usage is counted once per message id.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// `do` is orc under another name. The loop and rush names are kept so a retro can still read
// runs from before 2.0.0.
const ORC_SKILLS = [
  "orc",
  "do",
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
let closedFile = null;
const onlySessions = [];
for (let i = 2; i < args.length; i++) {
  if (args[i] === "--since") {
    const raw = args[++i];
    since = new Date(raw);
    if (Number.isNaN(since.getTime())) {
      console.error(`--since: unparseable date '${raw}'`);
      process.exit(2);
    }
  } else if (args[i] === "--session") onlySessions.push(args[++i]);
  else if (args[i] === "--closed") closedFile = args[++i];
}

// A session belongs to this repo only when it ran in the repo or one of its orc worktrees.
// The directory-name prefix alone can match an unrelated folder named like a worktree.
const rootPath = path.resolve(repoRoot).toLowerCase();
const worktreesPath = path.join(rootPath, ".claude", "worktrees") + path.sep;
function inThisRepo(cwd) {
  if (!cwd) return false;
  const p = path.resolve(cwd).toLowerCase();
  return p === rootPath || p.startsWith(worktreesPath);
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

// Reads one transcript, dropping lines that only repeat earlier content. `api-request-blob`
// lines re-send earlier messages with no timestamp, and any other repeat would count a tool
// call twice, so each tool_use id and each tool_result's tool_use_id is kept once per file.
function readLines(file) {
  const out = [];
  const seenTools = new Set();
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      // A line cut off by a crash or a session still writing; skip it.
      continue;
    }
    if (o.type === "api-request-blob") continue;
    const content = o.message?.content;
    if (Array.isArray(content)) {
      o.message.content = content.filter((c) => {
        const id =
          c.type === "tool_use"
            ? c.id
            : c.type === "tool_result"
              ? c.tool_use_id
              : null;
        if (!id) return true;
        const key = `${c.type}:${id}`;
        if (seenTools.has(key)) return false;
        seenTools.add(key);
        return true;
      });
    }
    out.push(o);
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

// Dollars per million tokens [input, output], from the pack's model tiers. Cache writes cost
// 1.25x (5 minutes) or 2x (1 hour) the input price and cache reads 0.1x.
const PRICES = [
  [/fable/i, [10, 50]],
  [/sonnet/i, [2, 10]],
  [/haiku/i, [0.1, 0.5]],
  [/./, [4, 20]],
];

function costOf(lines) {
  const seen = new Set();
  let cost = 0;
  for (const o of lines) {
    if (o.type !== "assistant" || !o.message?.usage) continue;
    const id = o.message.id ?? o.requestId ?? o.uuid;
    if (seen.has(id)) continue;
    seen.add(id);
    const u = o.message.usage;
    const [pin, pout] = PRICES.find(([re]) =>
      re.test(o.message.model ?? ""),
    )[1];
    const write1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    const write5m = Math.max(0, (u.cache_creation_input_tokens ?? 0) - write1h);
    const input =
      (u.input_tokens ?? 0) +
      1.25 * write5m +
      2 * write1h +
      0.1 * (u.cache_read_input_tokens ?? 0);
    cost += (pin * input + pout * (u.output_tokens ?? 0)) / 1e6;
  }
  return cost;
}

// A prompt the user typed, as opposed to a tool result, a background-task notice, or a reminder.
function isHumanPrompt(o) {
  if (o.type !== "user" || o.isMeta || o.isSidechain) return false;
  const c = o.message?.content;
  if (
    typeof c !== "string" &&
    !(Array.isArray(c) && c.some((x) => x.type === "text"))
  )
    return false;
  return !/^\s*(<(task-notification|system-reminder|local-command|bash-)|\[Request interrupted)/.test(
    textOf(c),
  );
}

// Minutes the session spent working: the span between transcript lines, less the time spent
// waiting for the user's next prompt. A scheduled wakeup's wait still counts as working.
function activeMinutes(lines) {
  let prev = null;
  let wakeupPending = false;
  let ms = 0;
  for (const o of lines) {
    if (o.isSidechain || !o.timestamp) continue;
    const t = new Date(o.timestamp);
    const human = isHumanPrompt(o);
    if (prev && !(human && !wakeupPending)) ms += t - prev;
    if (human) wakeupPending = false;
    for (const c of contentBlocks(o))
      if (c.type === "tool_use" && c.name === "ScheduleWakeup")
        wakeupPending = !c.input?.stop;
    prev = t;
  }
  return Math.round(ms / 60000);
}

// The pack skill a user message invoked, with its arguments, or null.
function invocation(o) {
  if (o.type !== "user") return null;
  const t = textOf(o.message?.content);
  const m = t.match(/<command-name>\/?(?:[\w-]+:)?([\w-]+)<\/command-name>/);
  if (!m || !ORC_SKILLS.includes(m[1])) return null;
  const args = t.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1] ?? "";
  return { skill: m[1], args: args.trim() };
}

// The issues a session worked: numbers on its commit commands' Closes, Fixes, and Refs lines and
// its `gh issue close` calls, plus the issue list an orc or do invocation was given.
function issuesWorked(lines) {
  const nums = new Set();
  for (const o of lines) {
    const inv = invocation(o);
    if (
      inv &&
      ["orc", "do"].includes(inv.skill) &&
      /^[\s#\d,-]+$/.test(inv.args)
    )
      for (const r of inv.args.matchAll(/(\d+)(?:-(\d+))?/g)) {
        const a = Number(r[1]);
        const b = r[2] ? Number(r[2]) : a;
        for (let n = a; n <= b && n - a < 200; n++) nums.add(n);
      }
    for (const c of contentBlocks(o)) {
      if (c.type !== "tool_use" || !["Bash", "PowerShell"].includes(c.name))
        continue;
      const cmd = String(c.input?.command ?? "");
      if (/git\s+commit/.test(cmd))
        for (const m of cmd.matchAll(
          /\b(?:closes|fixes|resolves|refs?)[: ]+#(\d+)/gi,
        ))
          nums.add(Number(m[1]));
      for (const m of cmd.matchAll(/gh\s+issue\s+close\s+#?(\d+)/g))
        nums.add(Number(m[1]));
    }
  }
  return [...nums].sort((a, b) => a - b);
}

// What a session was for, from the first pack skill it ran: a review (or a review's setup), a
// fix run scoped to a review's findings, or a build.
function roleOf(lines) {
  for (const o of lines) {
    const inv = invocation(o);
    if (!inv) continue;
    if (["orc-review", "deep-review"].includes(inv.skill))
      return /^setup\b/.test(inv.args) ? "setup" : "review";
    if (
      /\b(nits?|warnings?|blockers?|findings?|should.?fix)\b/i.test(inv.args) &&
      !/#?\d{2,}/.test(inv.args)
    )
      return "fix";
    return "build";
  }
  return "build";
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

// Masks credential-shaped text, so a secret a tool call or error echoed never reaches a report.
function redact(s) {
  return s
    .replace(/(authorization:\s*(bearer|basic)\s+)\S+/gi, "$1[redacted]")
    .replace(
      /\b(password|passwd|secret|token|api[-_]?key|access[-_]?key)(\s*[=:]\s*)\S+/gi,
      "$1$2[redacted]",
    )
    .replace(/\/\/[^/\s:@]+:[^/\s@]+@/g, "//[redacted]@")
    .replace(
      /\b(sk|pk|rk|ghp|gho|ghs|ghu|github_pat|xox[abprs]|AKIA|ASIA|npm)[-_A-Za-z0-9]{8,}/g,
      "[redacted]",
    )
    .replace(/(?<![\\/\w-])[A-Za-z0-9_-]{32,}(?![\\/\w-])/g, "[redacted]");
}

// One redacted line of transcript text, safe to place inside a Markdown table cell or list item.
function oneLine(s, n = 120) {
  return redact(
    String(s ?? "")
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .replace(/[`|]/g, "'")
    .replace(/^[#>\-*\s]+/, "")
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

const SEARCH_BASH =
  /^\s*(cd [^&;]+&&\s*)?(grep|rg|find|ls|tree|git grep|git ls-files)\b/;

function emptyMix() {
  return { search: 0, explore: 0, editRead: 0, edit: 0, other: 0 };
}

// Sorts an agent's tool calls into searching, reading files it never edits (exploring), reading
// files it edits, editing, and everything else, so a retro can see how much of a lane is search.
function toolMix(lines) {
  const mix = emptyMix();
  const edited = new Set();
  const uses = [];
  for (const o of lines) {
    for (const c of contentBlocks(o)) {
      if (c.type !== "tool_use") continue;
      uses.push(c);
      if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(c.name))
        edited.add(path.normalize(String(c.input?.file_path ?? "")));
    }
  }
  for (const c of uses) {
    if (["Grep", "Glob", "LSP"].includes(c.name)) mix.search += 1;
    else if (c.name === "Bash" && SEARCH_BASH.test(c.input?.command ?? ""))
      mix.search += 1;
    else if (c.name === "Read")
      edited.has(path.normalize(String(c.input?.file_path ?? "")))
        ? (mix.editRead += 1)
        : (mix.explore += 1);
    else if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(c.name))
      mix.edit += 1;
    else mix.other += 1;
  }
  return mix;
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
    const cost = costOf(lines);
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
      cost,
      weighted: weighted(usage),
      seconds:
        times.length > 1
          ? Math.round((new Date(times.at(-1)) - new Date(times[0])) / 1000)
          : 0,
      toolCalls,
      errors,
      mix: toolMix(lines),
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
  if (!inThisRepo(lines.find((o) => o.cwd)?.cwd)) return null;
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
        errorsById.set(
          c.tool_use_id,
          oneLine(
            textOf(c.content)
              .split("\n")
              .find((l) => l.trim()),
            120,
          ),
        );
    }
  }

  const timeline = [];
  const dispatches = [];
  let wakeups = 0;
  // A compaction writes a boundary line and then a summary line; count the boundaries, and fall
  // back to the summaries only for a transcript that has none.
  let boundaries = 0;
  let summaries = 0;
  let models = new Set();
  for (const o of lines) {
    if (o.type === "system" && /compact/i.test(o.subtype ?? ""))
      boundaries += 1;
    if (o.isCompactSummary) summaries += 1;
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
            cost: 0,
            weighted: 0,
            seconds: 0,
            toolCalls: 0,
            errors: 0,
            model: null,
            mix: emptyMix(),
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
        what = `${c.name} ${oneLine(c.input?.description ?? c.input?.file_path ?? c.input?.pattern ?? "", 90)}`;
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
    activeMinutes: activeMinutes(lines),
    humanPrompts: lines.filter(isHumanPrompt).length,
    role: roleOf(lines),
    issues: issuesWorked(lines),
    cost:
      costOf(lines) + [...subagents.values()].reduce((n, d) => n + d.cost, 0),
    skills,
    models: [...models],
    status: statusLines(lines),
    main: { usage: main, weighted: weighted(main) },
    subagentWeighted: dispatches.reduce((n, d) => n + d.weighted, 0),
    dispatchCount: dispatches.length,
    subagentTranscripts: subagents.size,
    wakeups,
    compactions: boundaries || summaries,
    toolErrors: [...errorsById.values()].slice(0, 20),
    toolErrorCount: errorsById.size,
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

let closed = null;
if (closedFile) {
  closed = new Set(
    JSON.parse(fs.readFileSync(closedFile, "utf8"))
      .filter((i) => !i.stateReason || i.stateReason === "COMPLETED")
      .map((i) => i.number),
  );
}
const builds = sessions.filter((s) => s.role === "build");
const issuesDone = new Set(
  builds.flatMap((s) => s.issues).filter((n) => !closed || closed.has(n)),
);

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
const money = (n) => `$${n.toFixed(2)}`;
const total = (arr, k) => arr.reduce((n, s) => n + s[k], 0);
md.push("## Per issue", "");
md.push(
  `Cost is dollars at the pack's model prices, main session plus subagents. Active minutes leave out time spent waiting for the user. Issues are the ones a build session worked${closed ? " that closed as completed" : " (pass --closed to count only closed ones)"}; review and fix sessions count as overhead on them.`,
  "",
);
md.push("| Role | Sessions | Cost | Active minutes | Prompts |");
md.push("| --- | --- | --- | --- | --- |");
for (const role of ["build", "review", "fix", "setup"]) {
  const r = sessions.filter((s) => s.role === role);
  if (r.length)
    md.push(
      `| ${role} | ${r.length} | ${money(total(r, "cost"))} | ${total(r, "activeMinutes")} | ${total(r, "humanPrompts")} |`,
    );
}
const work = sessions.filter((s) => s.role !== "setup");
const done = issuesDone.size;
md.push(
  "",
  done
    ? `**${done} issue(s): ${money(total(work, "cost") / done)} and ${Math.round(total(work, "activeMinutes") / done)} active minutes per issue, reviews and fixes included** (builds alone: ${money(total(builds, "cost") / done)} and ${Math.round(total(builds, "activeMinutes") / done)} minutes). Issues: ${[...issuesDone].map((i) => `#${i}`).join(", ")}.`
    : "No build session worked an issue in this window.",
  "",
);
md.push("## Sessions", "");
md.push(
  "| Session | Start | Role | Active min | Cost | Issues | Skills | Main wtok | Peak context | Subagent wtok | Dispatches | Wakeups | Compactions | Tool errors |",
);
md.push(
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
);
for (const s of sessions) {
  md.push(
    `| ${s.id.slice(0, 8)} | ${s.start.slice(0, 16)} | ${s.role} | ${s.activeMinutes} | ${money(s.cost)} | ${s.issues.map((i) => `#${i}`).join(" ")} | ${s.skills.join(", ")} | ${fmt(s.main.weighted)} | ${fmt(s.main.usage.peakContext)} | ${fmt(s.subagentWeighted)} | ${s.dispatchCount} | ${s.wakeups} | ${s.compactions} | ${s.toolErrorCount} |`,
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
      toolCalls: 0,
      mix: emptyMix(),
    };
    t.count += 1;
    t.toolCalls += d.toolCalls;
    for (const k of Object.keys(t.mix)) t.mix[k] += d.mix[k];
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

// Search and explore are the calls a shared usages map is meant to cut from the reviewer lanes.
md.push("", "## Tool mix by agent type", "");
md.push(
  "Per dispatch. Search is Grep, Glob, and grep-like Bash; explore is reading a file the agent never edits.",
  "",
);
md.push(
  "| Agent | Model | Dispatches | Tool calls | Search | Explore | Read then edited | Edits | Other |",
);
md.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
const per = (n, t) => (n / t.count).toFixed(1);
for (const t of [...byType.values()].sort((a, b) => b.weighted - a.weighted)) {
  md.push(
    `| ${t.agentType} | ${t.model} | ${t.count} | ${per(t.toolCalls, t)} | ${per(t.mix.search, t)} | ${per(t.mix.explore, t)} | ${per(t.mix.editRead, t)} | ${per(t.mix.edit, t)} | ${per(t.mix.other, t)} |`,
  );
}

const all = sessions.flatMap((s) =>
  s.dispatches.map((d) => ({ ...d, session: s.id.slice(0, 8) })),
);
md.push("", "## Costliest dispatches", "");
for (const d of all.sort((a, b) => b.weighted - a.weighted).slice(0, 15)) {
  md.push(
    `- ${d.session} ${d.time?.slice(11, 16) ?? "--:--"} ${d.agentType} (${d.model ?? "?"}): ${oneLine(d.description, 80)} - ${fmt(d.weighted)} wtok, ${d.toolCalls} tool calls, ${d.seconds}s`,
  );
}

md.push("", "## Signals", "");
for (const s of sessions) {
  md.push(`### ${s.id.slice(0, 8)}`, "");
  md.push(`- Status: ${s.status.length ? s.status.join(" / ") : "none found"}`);
  md.push(`- Models: ${s.models.join(", ") || "unknown"}`);
  if (s.dispatchCount > s.subagentTranscripts)
    md.push(
      `- Check the counts: ${s.dispatchCount} dispatches but ${s.subagentTranscripts} subagent transcripts. Either some agents left no transcript, or the transcript format repeats tool calls in a way this script doesn't drop.`,
    );
  if (s.repeatedDispatches.length)
    md.push(
      `- Repeated dispatches (same agent and description): ${s.repeatedDispatches.length}: ${[
        ...new Set(s.repeatedDispatches),
      ]
        .slice(0, 10)
        .map((k) => k.replace("|", ": "))
        .join("; ")}`,
    );
  if (s.toolErrorCount)
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
