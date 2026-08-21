# The orc pack

`/orc` is an autonomous orchestrator for Claude Code. You point it at work — or let it pick the work — and it carries that work all the way to committed, reviewed, green code without you babysitting it. It's built for "yolo" runs: kick it off, walk away, come back to a finished issue and a written summary of what it did and why.

Under the hood it runs **subagent-driven development**. The orchestrator keeps its own context clean and dispatches the actual work to a team of specialized subagents — a scout that picks the next issue, implementers that write the code, a panel of reviewers that check it, and a skeptical verifier that filters out the reviewers' false positives. It loops between reviewing and fixing until only nitpicks are left, then runs your repo's checks, commits, and closes the issue.

This pack contains the `/orc` skill plus all the agents it relies on, written to work in **any** repo.

> **Run it on any capable model — just not Opus 5.** Orc drives well on essentially any strong Claude model (Opus 4.8 and Sonnet 5 are what we use day to day). The one model to avoid is **Opus 5**: it hallucinates, goes off script, and generally wastes review and fix rounds, so we don't use it or recommend it. Everything else works great. The skill enforces this internally too: it won't dispatch its subagents on Opus 5. For the full breakdown of what goes wrong, see [our benchmarks](https://rogadigital.com/labs/benchmarks/). Inside a run, orc uses the capable models for the thinking work (implementing, reviewing, verifying) and Haiku for the lightweight scan-and-report work (picking the next issue, running lint/tests). There's also one setup step you'll almost certainly need: turning the to-do list tool back on. See ["Turn on the to-do list"](#turn-on-the-to-do-list-newer-models) below.

---

## The three ways to run it

**1. Undirected — "just pick something and go."**

```
/orc
```

With no argument, orc dispatches a lightweight scout agent (`next-issue-finder`, on Haiku) that reads your GitHub issue board and picks the single highest-value issue to work on next, using a four-signal ruleset: does it unblock other work, how severe/impactful is it, how ready is it to execute, and how old is it. Then it runs the whole build-review-commit-close cycle on that issue.

**2. Directed at an issue — "do this specific one."**

```
/orc 123
```

Give it an issue number (or "finish the epic", "do #18") and it skips the scouting and goes straight to work on that issue.

**3. Free-text task — "here's what I want, figure it out."**

```
/orc add rate limiting to the upload endpoint
/orc the date picker breaks on Safari, track it down and fix it
```

Describe the work in plain language and orc treats your sentence as the spec. It reads the relevant code, turns your one-liner into a concrete, testable definition of done, and builds it — no issue required.

In every mode, orc ends with one explicit line so you know the outcome at a glance:

- **`FINISHED`** — work landed, green, pushed, issue closed.
- **`FINISHED (no build)`** — there was genuinely nothing to build (empty board, or every issue was blocked), so it did board work instead — filed evidence, labels, new issues.
- **`NOT FINISHED`** — a real human-only blocker (dirty tree, missing credential, a decision only you can make). It tells you exactly what to do to unblock it.

---

## What's in the box

**The skills:**

- `skills/orc/` — the orchestrator itself.
- `skills/newissue/` — turns a rough idea into a detailed, self-contained GitHub issue: a plain-language title and lead paragraph a PM can track, full technical detail below for the executing agent, sized so one orc run can carry one issue to done — splitting into multiple issues, or an `[EPIC]` with an ordered roadmap of children, when the work is too big for one. It's how orc's Discoveries step files follow-up work, and it takes per-repo house rules (labels, milestones, tone) from `.claude/newissue.local.md` or your `CLAUDE.md`. Optional, but the board gets much better with it.

**The agents** (`agents/`):

| Agent                    | Role                                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| `next-issue-finder`      | Scout — picks the next issue from the board (used only in undirected runs) |
| `lint`                   | Runs the repo's lint/format chain, reports raw results                     |
| `typecheck`              | Runs the repo's type checker                                               |
| `test`                   | Runs the repo's test suite(s)                                              |
| `impact`                 | Diff stats for a change                                                    |
| `fallow`                 | Optional codebase-intelligence audit (JS/TS repos with the `fallow` CLI)   |
| `security-reviewer`      | Input validation, secrets, XSS, SSRF, injection, path traversal            |
| `architecture-reviewer`  | Structure, module boundaries, framework conventions                        |
| `quality-reviewer`       | Type safety, error handling, performance, accessibility                    |
| `test-coverage-reviewer` | Depth and meaningfulness of test coverage                                  |
| `verifier`               | Skeptical second pass that filters reviewer false positives                |
| `docs-writer`            | Project documentation                                                      |
| `skill-vetter`           | Static security audit of untrusted skills/plugins before you install them  |

Orc doesn't run every reviewer on every change — it looks at what the diff touches and **selects the reviewers that apply**. A comment-only tweak doesn't wake the security panel; a change to an upload handler does.

The reviewers, tooling runners, and the scout are all also useful on their own, outside of orc — for example during a manual code review.

---

## Two ways to install

**As a plugin — quickest, available in all your projects.** This repo is its own Claude Code plugin marketplace. In any Claude Code session:

```
/plugin marketplace add rogadev/orc-pack
/plugin install orc-pack@orc-pack
```

The skill and all agents load automatically after install; the skill is invoked as `/orc-pack:orc`. The plugin version is pinned in `.claude-plugin/plugin.json`, so you receive updates when a new version is released, not on every commit.

**Into a repo — committable and tunable.** Copy the pack into one repo's `.claude/` so it ships with the repo, can be committed for a team, and can be tuned to that repo's stack (a repo-specific security reviewer, for example). Plugin files live in a read-only cache; repo copies are yours to edit. This is the path described in the next section, and it's the right one for team repos or customized installs.

## Installing it into a project

The companion `INSTALL.md` is written **for an AI agent**. The intended flow:

1. Clone this repo somewhere outside the target project.
2. Open a Claude Code session in the repo you want orc in and point Claude at the clone — for example: _"Read the INSTALL.md in `~/orc-pack` and install this pack into this repo."_
3. Claude copies the skill to `.claude/skills/orc/` and the agents to `.claude/agents/`, checks for conflicts with anything already there, adapts to your repo, and verifies the result.

If you'd rather do it by hand, it's just a copy:

- `skills/orc/SKILL.md` → `<repo>/.claude/skills/orc/SKILL.md`
- every file in `agents/` → `<repo>/.claude/agents/<same-name>.md`

Use `~/.claude/` instead of `<repo>/.claude/` if you want orc available in every project on your machine rather than just one. **Skills and agents load when a session starts**, so start a fresh Claude Code session after installing.

> The pack's agents are written to be generic — they discover your repo's stack, commands, and conventions at runtime by reading your `CLAUDE.md`/`AGENTS.md`, your manifest, and the surrounding code. They work as-copied. If your repo has a `CLAUDE.md` that documents your ready command (like `pnpm ready`) and your working branch (like `dev`), orc picks those up automatically.

---

## Turn on the to-do list (newer models)

Orc runs best when it can build its plan as a **live task list** and work it top to bottom — that's how an unsupervised run never drops a step. The task list is orc's spine.

Recent Claude Code versions (v2.1.233+) **turn the to-do / Task tools off by default on newer models** — including **Opus 4.8** and **Sonnet 5** (and Fable 5). The reasoning from the docs: these models track multi-step work internally, and the tool definitions take up context, so Claude Code omits them unless you opt in. Since orc runs on those newer models, you'll want to switch the tools back on.

**The fix — set one environment variable before launching Claude Code:**

```bash
# macOS / Linux
export CLAUDE_CODE_ENABLE_TODO_TOOLS=1
claude
```

```powershell
# Windows PowerShell
$env:CLAUDE_CODE_ENABLE_TODO_TOOLS = "1"
claude
```

To make it permanent, add `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` to your shell profile (`~/.bashrc`, `~/.zshrc`) or your Windows user environment variables so every session has it.

**Alternative — allow the tools explicitly at launch:**

```bash
claude --allowedTools TaskCreate TaskGet TaskList TaskUpdate
```

Once enabled, the model gets the four Task tools (`TaskCreate`, `TaskGet`, `TaskUpdate`, `TaskList`) and orc uses them to track its plan as it works.

> **If you don't turn them on**, orc still runs — the skill tells it to fall back to an inline checklist in its reasoning. But the built-in task list is a much better experience, and it's what the "adds to-dos as it builds its plan" behavior depends on.

> **Which tools, exactly?** `TaskCreate/TaskGet/TaskUpdate/TaskList` are the current, persistent task system (stored under `~/.claude/tasks/`). The older `TodoWrite` was an ephemeral, in-context-only checklist and is deprecated. `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` turns the current Task tools on.
>
> Setting names and defaults can shift between Claude Code releases — if the variable above doesn't take effect, check your version's tools reference (`code.claude.com/docs`) for the current knob.

---

## How a run actually flows

1. **Orient & guard.** Orc reads your repo conventions and refuses to start on a dirty working tree or a protected branch (`main`/`master`) — those are yours to clear first.
2. **Get the work.** Scout picks an issue (undirected), or it takes your issue number / free-text task.
3. **Make it buildable.** Most work isn't perfectly spec'd. Orc sharpens it — splitting off the executable part, shipping a defensible default for a missing tuning value, or writing down a decision — rather than stopping because the issue was vague.
4. **Plan as tasks.** It decomposes the work into a task list and works it in order.
5. **Build → review → fix, looping.** Per task: an implementer writes code and tests; the applicable reviewers check the diff; the verifier filters false positives; blocking findings go back for a fix. Bounded at three rounds so it can't loop forever.
6. **Discoveries get actioned.** Anything it finds along the way gets fixed, or filed as a new issue — never just mentioned and forgotten.
7. **Ready & land.** It runs your repo's aggregate check, and only if that's green does it push and close the issue.
8. **Report.** A tight, point-first summary in the Google developer-documentation voice — what it picked and why, what landed and where, what changed on the board, and anything that needs your call — capped by the one literal status line (`FINISHED` / `FINISHED (no build)` / `NOT FINISHED`).

## Good to know

- **It commits and pushes to your working branch** (typically `dev`) but **never opens a PR, never touches `main`, and never force-pushes.** Promoting to your release branch stays your decision.
- **It won't fake a finish.** It won't suppress a failing check, silence a real defect, or close an issue it didn't actually resolve. A `NOT FINISHED` is honest.
- **It's for repos that track work as issues** (for the undirected and issue modes) and use `gh`. The free-text mode works without an issue board.
- **Watch the first few runs.** "Autonomous" doesn't mean "unsupervised forever" — get a feel for how it picks and scopes work in your repo before you truly walk away.
