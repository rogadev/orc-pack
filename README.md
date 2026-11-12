# The orc pack

**New in v2.0.0:** `/orc` now works your GitHub issues end to end in the main session, one at a time, with no builder or reviewer agents. Give it one issue, a list, a range, `next 10`, or a plain-text request. You review afterward with `/orc-review` in a fresh session, and `/orc warnings and nits` fixes what the review found. `/do` is the same skill under another name. `/orc-loop` and `/orc-rush` are gone, because one skill now handles single issues and batches. See [Why one session](#why-one-session) and the [changelog](CHANGELOG.md).

### 2.0.0 by the numbers

![Chart: per closed issue, 1.x against 2.0.0. Cost $35.63 against $27.33 (23% lower), uncached tokens 2.23M against 1.36M (39% fewer), active time 68 against 43 minutes (37% faster), build time 63 against 18 minutes (71% faster), and first-review findings 0.14 Blockers and 7.0 Warnings against 0.12 and 5.6 (on par)](docs/media/orc-2-results.png)

We ran the new workflow for a week in place of the old one and measured each closed issue end to end, with the follow-up review and its fix-ups included, in the projects that used both:

| Per issue                 | 1.x (`/orc`, `/orc-loop`, `/orc-rush`) | 2.0.0 (`/orc`, then `/orc-review`) | Change         |
| ------------------------- | -------------------------------------- | ---------------------------------- | -------------- |
| Cost                      | $35.63                                 | $27.33                             | **23% lower**  |
| Uncached tokens           | 2.23M                                  | 1.36M                              | **39% fewer**  |
| Active time               | 68 minutes                             | 43 minutes                         | **37% faster** |
| Build time alone          | 63 minutes                             | 18 minutes                         | **71% faster** |
| Blockers per first review | 0.14                                   | 0.12                               | On par         |
| Warnings per first review | 7.0                                    | 5.6                                | On par         |

The issues were the same size on both sides (about 1,690 changed lines on average). Cost uses Anthropic's per-token prices for the models each session ran; active time leaves out time spent waiting for you.

`/orc` works GitHub issues for Claude Code. For each issue, it reads the issue and the code, plans the change, pins the behavior in tests, builds it, screenshots any UI change, updates the docs, and commits one commit per issue. When the batch is done, it asks whether to push to your integration branch, then closes each issue with a comment that says where it landed.

The review is a separate step that you start. Run `/orc-review` (or your project's `/deep-review`) in a fresh session over what orc committed. It runs only the reviewer agents the change calls for, filters their findings through a skeptical verifier, and gives you a verdict. Then run `/orc warnings and nits` to fix what it found.

This pack contains `/orc`, `/do`, `/orc-review`, the reviewer agents the review relies on, and a few supporting skills, written to work in **any** repo.

### Why one session

Up to 1.x, orc was an orchestrator: it handed each task to builder subagents and ran a panel of reviewers on every task before it committed. In 2.0.0, the main session builds, and the review runs once afterward.

Building in one session, which already holds the context, and reviewing once at the end turned out cheaper and faster per issue, with no measurable loss in review quality. See [2.0.0 by the numbers](#200-by-the-numbers).

---

## Ways to run it

```
/orc 123                 # one issue
/orc 123 125 130         # a list
/orc 350-360             # a range
/orc next 10             # the 10 most important open issues on the board
/orc add a CSV export to the reports page
```

- **Issues, lists, and ranges.** Give it issue numbers, separated by spaces or commas, with or without `#`, inclusive ranges, or issue URLs. Orc fetches each one, drops pull requests, closed issues, and numbers that don't exist, and checks the code to confirm each issue isn't already fixed. An issue that is already fixed gets a comment naming the commit, and orc closes it.
- **`next N`.** Orc ranks the open board itself and takes the top N. It follows the ranking rule your repo documents, if it has one. Otherwise it puts urgent and security issues first, then works by priority label and milestone, then bugs, then issues that unblock others, then the oldest. It skips issues another session has claimed and issues blocked by open work, and it takes an epic's open children instead of the epic.
- **A plain-text request.** Orc treats your text as the issue. It checks that the work isn't already tracked or done, writes a brief with a scope and testable acceptance criteria to the session scratchpad, and splits the text into separate items when it holds several changes. It files nothing unless you tell it to (for example, "file it"). Text that refers to this conversation, such as `warnings and nits` right after a review, is scoped to exactly those items.

`/do` takes the same arguments and runs the same skill.

### The plan and the go-ahead

For each issue, orc reads the issue, the docs that cover its area, and the code, then writes a plan: one line for a small change, or the files, approach, risks, tests, screenshots, migration, and docs for anything larger. For a list, it shows every plan in one message and waits for one go-ahead that covers the whole list. You can approve, edit, or drop items. A single small issue and a plain-text request skip the wait: orc states the plan and starts building.

### How each issue gets built

1. **Pin the behavior.** Orc writes the tests for new logic first, and a failing test that reproduces a bug before it fixes the bug.
2. **Build it** at the scope the plan set. A small problem next to the change gets fixed and mentioned; anything larger goes in the report.
3. **Schema changes** use your repo's migration tool, stay additive, and run only against a local or test database.
4. **Look at UI changes.** Orc screenshots each changed route at 390 and 1440 pixels wide, in light and dark, and looks at every shot before it moves on. It uses your repo's verification recipe when it has one.
5. **Update the docs** that describe the changed behavior.
6. **Commit** one commit per issue, with a subject that names the change and a `Closes #<n>` line. When your repo has hooks that gate `git commit`, orc relies on them; otherwise it runs the format check, type check, and covering tests before each commit.

Orc stops partway through a list only for a contradiction with a doc, spec, or ADR, a decision only you can make, a plan that turns out to be wrong, or a failure it can't fix. It tells you which issues are done and which remain.

### The report and the push

Before it reports, orc runs your repo's ready check once over the whole run, plus the `fallow` agent when the run removed or moved code. Then it reports each issue with its commit, the gate result, the paths of its screenshots, and anything skipped or still open.

When your request already said to push (for example, `/orc 350-360 and push to dev`), orc pushes without asking. Otherwise it ends with one question: "Do you want me to push this to `dev`?" After the push, it comments on and closes each issue that is fully resolved. It never opens the promotion PR unless you ask.

### Review a branch before you merge: `/orc-review`

```
/orc-review              # the branch against its integration or release branch
/orc-review working      # uncommitted changes only
/orc-review main..abc123  # a range; checked out at its end, so later commits don't leak in
/orc-review #123         # a pull request, reviewed from its merge base without checking it out
/orc-review quick        # at most two lanes, for a fast check
/orc-review full         # every lane the change touches, borderline ones too, with screenshots
/orc-review setup        # draft this project's /deep-review profile
```

`/orc-review` reviews a branch, a range, a pull request (`/orc-review #123`), or uncommitted work, and changes nothing. It sorts each changed file by risk surface and runs only the reviewers those surfaces call for: `security-reviewer` only when the change touches a trust boundary such as auth, input handling, or secrets; only the UI lanes for a change to markup and styles; nothing for a change to docs and comments. There is no cap on the number of reviewers, so a change that crosses several risk surfaces gets every lane it needs. The `verifier` filters the findings (it skips a run with only Nits), and the report ends with a verdict: not ready, ready after small fixes, ready to merge, or incomplete.

Run it in a fresh session after an `/orc` run, so the review doesn't read the build's reasoning. Then run `/orc warnings and nits` (or `/orc fix the Blocker and the Warnings`) to fix what it found. Orc reports how many Blockers, Warnings, and Nits it fixed and which it left open.

Run `/orc-review setup` once per project. It writes `.claude/skills/deep-review/SKILL.md`, a short profile with that project's stack, a risk map of real paths (which files sit on the trust boundary, which are server, data, and UI), what to leave out of the diff, the architecture, and the patterns that look wrong but are deliberate. From then on, `/deep-review` runs the same workflow with the profile, so the choice of reviewers is exact for that app. Each risk-map row says which surface a path is, and an optional **Extra lanes** column adds reviewers on top, for example `security-reviewer` on a billing folder.

When setup has written the profile, a separate `setup-auditor` agent reads it cold, with none of setup's notes or your answers, and checks it against the repo: that every path and symbol exists, the counts are right, the checks table's commands are real, **Never run** names every script that writes, and the profile doesn't copy the review workflow. Facts the repo settles are fixed. Judgment calls, such as a risk-map row that looks too broad, are listed for you to decide, because the agent that built the profile knew the project and the auditor doesn't. It often finds nothing.

The pack's reviewers are the base, and a project can layer its own specialists on top where that base is thin, for example an accessibility lane far deeper than the one bullet `ui-reviewer` gives it. These **repo lanes** are agents in your `.claude/agents/` that follow the contract in `skills/orc-review/references/lane-template.md`, and the profile says what each one owns and when it runs. When `setup` converts a hand-written reviewer suite, it inventories every agent, reference, and script the suite used, shows you which pack lane covers each old lane and how deeply, keeps the specialists the pack can't replace, rewrites them to the contract, and checks every path and fact it carries over against the code. The profile can also hold the project's check commands, its platform constraints (timeouts, replicas, gateway behavior), a step that runs after verification, and a folder to save each report in. The profile belongs to your repo: a pack update never overwrites it, and improvements to the workflow reach it without copying anything. If you already wrote your own `deep-review` skill, `setup` converts it and keeps its project-specific parts.

When the pack changes the shape of the profile or the repo-lane contract, which is rare, it bumps a **review template** number of its own, separate from the pack version, and records what changed in `skills/orc-review/references/template-changes.md`. Your profile records the template number it was built for. When a newer one ships, `/deep-review` ends its report with one line naming what changed. Run `/orc-review setup` to apply the changes you want, and any you turn down are recorded in the profile and never offered again. Or run `/orc-review setup skip` to keep the profile as it is. Either way the reminder stops until the template changes again, and pack releases that don't touch the template never raise it.

### Look back at a run: `/retro`

```
/retro             # the last 7 days
/retro 14d         # every session in the last 14 days
```

`/retro` reads the session transcripts of your `/orc` and `/do` runs in this repo, and the reviews and fix runs that followed them, and tells you what an issue costs and what to improve. It measures cost, tokens, and active time per closed issue, how much of that went to review and fix-up, and what the reviews found. Each finding comes with its evidence, its rough cost, and where to fix it: the pack, your repo's docs or review profile, or how you started the run. It changes nothing, saves each retro under `.git/orc-retro/`, and compares with the last one.

---

## What's in the box

**The skills:**

- `skills/orc/` — the issue workflow itself, plus `references/`: the shared standards and stack playbooks the review lanes check against (see [The standards](#the-standards)), and `update-check.md`, the once-a-day release check.
- `skills/do/` — `/do`, the same skill as `/orc` under another name. It reads and follows `skills/orc/SKILL.md`.
- `skills/orc-review/` — the read-only deep review of a branch before a merge, plus `references/profile-template.md`, the project profile `/orc-review setup` fills in as the repo's own `/deep-review`, `references/lane-template.md`, the contract a project's own reviewer lanes follow, and `references/template-changes.md`, the review template's version and what each version changed. See [Review a branch before you merge](#review-a-branch-before-you-merge-orc-review).
- `skills/retro/` — a retrospective on past runs: what an issue costs, where the tokens and time went, and what to improve. See [Look back at a run](#look-back-at-a-run-retro).
- `skills/tiedown/` — run `/tiedown` when you think a session is finished. It checks the whole session and the real state of the repo and machine for unanswered questions, unfinished requests, unpushed or uncommitted work, failed or skipped checks, things still running, open issues, and promises not yet kept. It replies "We're done." when nothing is left. Otherwise it thinks through each open item, with no subagent for an obvious one and a Haiku, Sonnet, or Opus subagent sized to the rest, and gives you one final list: the exact action, a one-sentence reason, and who does it. Reply "do all of it" to approve. It never changes anything itself. Optional.
- `skills/update-orc/` — updates an installed pack to the latest release from any older version, by dispatching the `orc-updater` agent. See [Updating the pack](#updating-the-pack) below.
- `skills/newissue/` — turns a rough idea into a detailed, self-contained GitHub issue: a plain-language title and lead paragraph a PM can track, full technical detail below for the executing agent, with a `**Size band:**` line (Small, Medium, Large, or Huge) that is copied onto the project's own size labels when it has them, splitting into multiple issues, or an `[EPIC]` with an ordered roadmap of sized children, when the work is too big for one. Orc uses it when you ask it to file a plain-text request, and it takes per-repo house rules (labels, milestones, tone) from `.claude/newissue.local.md` or your `CLAUDE.md`. Optional, but the board gets much better with it.
- `skills/shipcheck/` — run `/shipcheck` after a push. It waits for CI and fixes a red run in the session (two attempts at most), checks that every secret in `.claude/required-secrets.md` exists in the target environment, waits until the deploy serves the pushed commit, then runs each flow in `.claude/smoke-checklist.md` at 390px and 1440px in light and dark mode, in Playwright by default (exact viewports and a clean browser profile) with Claude in Chrome as the fallback. It stops and tells you what to unlock at an SSO or VPN wall, and turns each regression into a fix branch with a reproducing test, built in the session, or an issue with screenshots. It drafts both files from your code the first time.

**The agents** (`agents/`):

| Agent                    | Model and effort | Role                                                                                                                   |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `quality-reviewer`       | Opus 5.5, medium | Readability, AI slop code, type safety, error handling, async and state, reuse, performance                            |
| `architecture-reviewer`  | Opus 5.5, medium | Separation of concerns, module boundaries, file and folder structure, framework conventions                            |
| `ui-reviewer`            | Opus 5.5, medium | Design system and theme, states, interaction, responsive, accessibility, copy; screenshots when the app runs locally   |
| `security-reviewer`      | Opus 5.5, high   | Input validation, secrets, XSS, SSRF, injection, path traversal                                                        |
| `comment-reviewer`       | Opus 5.5, low    | Cold-read test on every comment in touched files; JSDoc on exports; slop comments                                      |
| `test-coverage-reviewer` | Sonnet 5.5, high | Depth and meaningfulness of test coverage                                                                              |
| `verifier`               | Opus 5.5, medium | Skeptical second pass that filters reviewer false positives                                                            |
| `setup-auditor`          | Opus 5.5, medium | Blind audit of a freshly written deep-review profile: checks its facts against the repo (used by /orc-review setup)    |
| `usages`                 | Haiku            | Maps where a diff's code is used (callers, importers, tests) once, so the review lanes don't each search for it        |
| `fallow`                 | Haiku            | Codebase-intelligence audit on JS/TS repos: dead code, duplication, complexity, circular deps (self-skips when absent) |
| `lint`                   | Haiku            | Runs the repo's lint and format chain, reports raw results                                                             |
| `typecheck`              | Haiku            | Runs the repo's type checker                                                                                           |
| `test`                   | Haiku            | Runs the repo's test suites                                                                                            |
| `dependency-vetter`      | Opus 5.5, high   | Supply-chain security vet of a package version (fallow) before install or update                                       |
| `skill-vetter`           | Opus 5.5, high   | Static security audit of untrusted skills and plugins before you install them                                          |
| `orc-updater`            | Opus 5.5, high   | Applies an orc-pack release to an installed copy, converging it on the target kit (used by /update-orc)                |

`/orc` itself dispatches only `fallow`, and only at the end of a run that removed or moved code; it sends wide code searches to the built-in Explore agent. The reviewers, the verifier, `usages`, and the gate runners (`lint`, `typecheck`, `test`) are `/orc-review`'s lanes. They are also useful on their own, for example during a manual code review.

---

## The standards

The quality bar lives in `skills/orc/references/`, and `/orc-review`'s reviewer lanes check against it. The review detects your stack from your profile or your manifest and hands each lane the files it needs:

- **`standards/code.md`** — readability, types, errors, async, state, reuse, and a named list of AI slop code patterns (defensive noise, pass-through layers, reinvented utilities, synced state, and more).
- **`standards/comments.md`** — the cold-read test (every comment must make sense to someone who sees only the file), JSDoc on exports following Google's style guides, and the slop comments to remove.
- **`standards/structure.md`** — layers, separation of concerns, the server and client boundary, and file and folder placement.
- **`standards/ui.md`** — design-system and theme adherence, every interaction state, responsive behavior, accessibility (WCAG 2.2 AA), and copy.
- **`standards/data.md`** — migrations, expand/contract changes, locks, backfills, indexes, and query safety.
- **`frameworks/`** (Next.js, Nuxt, SvelteKit, Astro) and **`platforms/`** (Cloudflare, Vercel) — each loads only when the review detects that stack, and tells the lanes to trust the installed version's docs over the playbook.

Your repo always wins: every file defers to your `CLAUDE.md`/`AGENTS.md` and your established patterns, so the review never pushes a project structure onto your code that it doesn't already follow.

---

## Fallow

Fallow is a static codebase-intelligence pass that finds dead code, code duplication, complexity hotspots, circular dependencies, and unused or unlisted dependencies. `/orc-review` runs it as a lane on JS/TS changes, and `/orc` runs it before its report when the run removed or moved code. The `fallow` agent scopes `fallow audit` to the change and reports the findings, and it self-skips on a non-JS/TS project. It is installed by default after it passes the same supply-chain vet. The pack only reads: it never runs `fallow fix`, which would rewrite source.

---

## Progress on your status line

Install [paceline](https://github.com/rogadev/paceline), a Claude Code status line, and register its `paceline-mcp` server to watch a run's progress without reading the transcript:

```
orc ▰▰▰▰▱▱ #356 upload limit build 62%
```

Orc starts the bar with a `plan` cell as soon as it reads your arguments. Once the plan is approved, it adds one cell per issue, weighted by size, with the stages `test`, `build`, `look` (for a UI change), and `commit`, then a `ready check` cell, a `push` cell, and a `review` cell. When the push is waiting on you, the bar stays open with the label `push needed`. The review runs in another session, so orc marks that cell skipped when it pushes. Without paceline, orc skips the bar silently. The updates ride along with calls orc already makes, so they add no turns.

---

## Two ways to install

**As a plugin — quickest, available in all your projects.** This repo is its own Claude Code plugin marketplace. In any Claude Code session:

```
/plugin marketplace add rogadev/orc-pack
/plugin install orc-pack@orc-pack
```

The skills and agents load automatically after install; the skills are invoked as `/orc-pack:orc`, `/orc-pack:do`, `/orc-pack:orc-review`, and so on. The plugin version is pinned in `.claude-plugin/plugin.json`, so you receive updates when a new version is released, not on every commit.

**Into a repo — committable and tunable.** Copy the pack into one repo's `.claude/` so it ships with the repo, can be committed for a team, and can be tuned to that repo's stack (a repo-specific security reviewer, for example). Plugin files live in a read-only cache; repo copies are yours to edit. This is the path described in the next section, and it's the right one for team repos or customized installs.

## Installing it into a project

The companion `INSTALL.md` is written **for an AI agent**. The intended flow:

1. Open a Claude Code session in the repo you want orc in — that repo is the install target.
2. Point Claude at this repo's URL, for example: _"Install https://github.com/rogadev/orc-pack into this repo."_ Claude clones the kit into a scratch location and follows `INSTALL.md`. If you already have a clone somewhere outside the target project, you can point at that instead: _"Read the INSTALL.md in `~/orc-pack` and install this pack into this repo."_
3. Claude copies the skills to `.claude/skills/` and the agents to `.claude/agents/`, checks for conflicts with anything already there, adapts to your repo, and verifies the result.

If you'd rather do it by hand, it's a copy:

- each directory in `skills/` (the whole directory, including its `references/`) → `<repo>/.claude/skills/<same-name>/`. `skills/orc/` and `skills/do/` go together, because `/do` reads orc's skill file, and `/orc-review` reads `skills/orc/references/`.
- every file in `agents/` → `<repo>/.claude/agents/<same-name>.md`

Use `~/.claude/` instead of `<repo>/.claude/` if you want orc available in every project on your machine rather than just one. Either way the pack goes into the repo your session is open in, never into a checkout of `orc-pack` itself; if Claude starts "installing" into an `orc-pack` folder it found on your machine, stop it and open the session in the target repo. **Skills and agents load when a session starts**, so start a fresh Claude Code session after installing.

The pack is written to be generic: orc and the agents discover your repo's stack, commands, and conventions at runtime by reading your `CLAUDE.md`/`AGENTS.md`, your manifest, and the surrounding code. They work as copied. If your repo has a `CLAUDE.md` that documents your ready command (like `pnpm ready`) and your working branch (like `dev`), orc picks those up automatically.

---

## Updating the pack

- **Plugin install** — run `/plugin update orc-pack@orc-pack`, which picks up a new version once `plugin.json`'s version changes. To get releases without asking, turn on auto-update: in `/plugin`, open **Marketplaces**, select `orc-pack`, and choose **Enable auto-update**. Claude Code leaves it off for third-party marketplaces, and a marketplace can't turn it on for you.
- **Copied-into-`.claude/` install** — run `/update-orc`. It reads your installed version, finds the latest GitHub release, fetches the pack at that tag, and dispatches an Opus 5.5 updater that converges your copy on the release. It works from **any** older version in one pass, so you don't step through releases one at a time; it reads every changelog entry in the gap plus the release's update notes as its map (falling back to the tag diff when notes are thin), preserves your repo-local edits, and never clobbers a file the repo owns. Coming from 1.x, it removes the skills, agents, and references that 2.0.0 dropped and adds `skills/do/`. It does not commit — review the changes, then commit and push them yourself.

You don't have to watch for releases. `/orc` (and `/do`) and `/orc-review` check the latest GitHub release at most once a day, and when it's newer than your install, the report ends with one line naming the new version and the command for your install kind. The check never updates anything, and it stays silent when you're offline.

Every release's notes come from `CHANGELOG.md`, and the release guard refuses to publish a version without a section there. That's what keeps future update agents oriented.

---

## Turn on the to-do list (newer models)

Orc tracks each issue in a run as a **live task**, marking it in progress and completed as it goes, so a long list never drops an issue.

Recent Claude Code versions (v2.1.233+) **turn the to-do / Task tools off by default on newer models** — including **Opus 4.8**, **Sonnet 5**, and Fable 5, and likely the models released since, such as Opus 5.5. The reasoning from the docs: these models track multi-step work internally, and the tool definitions take up context, so Claude Code omits them unless you opt in. Since orc runs on those newer models, you'll want to switch the tools back on.

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

Once enabled, the model gets the four Task tools (`TaskCreate`, `TaskGet`, `TaskUpdate`, `TaskList`) and orc uses them to track the issues in a run.

**Which tools, exactly?** `TaskCreate/TaskGet/TaskUpdate/TaskList` are the current, persistent task system (stored under `~/.claude/tasks/`). The older `TodoWrite` was an ephemeral, in-context-only checklist and is deprecated. `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` turns the current Task tools on. Setting names and defaults can shift between Claude Code releases; if the variable above doesn't take effect, check your version's tools reference (`code.claude.com/docs`) for the current knob.

---

## How a run actually flows

1. **Learn the repo.** Orc reads your `CLAUDE.md` or `AGENTS.md`, `.claude/rules/`, `.claude/settings.json`, and manifest for the integration branch, the check and test commands, the ready check, the dev server, and any UI verification recipe. Your repo's docs and hooks win over the skill's general steps.
2. **Resolve the list.** It parses your issues, range, `next N`, or text request, fetches each issue, drops what is closed or already fixed, and orders the rest by number (or by rank for `next N`), with blockers first. It stays on the integration branch in your checkout and never stages files another session left uncommitted.
3. **Plan.** It reads each issue's docs and code and writes a plan, then waits for one go-ahead on a list. A single small issue or a text request starts at once.
4. **Build each issue in order.** Tests first, then the change, screenshots of any UI change at 390 and 1440 pixels in light and dark, the docs, and one commit per issue.
5. **Report.** It runs the ready check once over the whole run, reports each issue, and asks whether to push (or pushes when you already said to).
6. **Push and close.** After the push, it comments on and closes each fully resolved issue. A partly resolved issue gets a comment and stays open.
7. **Review, in a fresh session.** You run `/orc-review` over what orc committed, then `/orc warnings and nits` to fix what it found.

## Good to know

- **Run it on Opus 5.5 (`claude-opus-5-5`).** `/orc` refuses to start on Opus 5 (`claude-opus-5`, the 5.0 release), which hallucinates, drifts off task, and reports problems that aren't there.
- **You start it; it doesn't start itself.** `/orc` and `/do` are user-invoked only, so Claude never runs them on its own.
- **It commits to your working branch** (typically `dev`) and pushes only when you say so. It **never opens a PR, never touches `main`, and never force-pushes.** Promoting to your release branch stays your decision.
- **It won't fake a pass.** It fixes the cause of a failing check and never weakens, skips, or deletes a test to get green. A failure it can't fix stops the run and comes back to you.
- **It's for repos that track work as GitHub issues** and use `gh`. A plain-text request works without an issue board.
- **When you correct it** on something it should have known, it proposes the check that would have caught it: a lint rule, a test, or a hook first, and a line in `CLAUDE.md` only when nothing deterministic fits.
