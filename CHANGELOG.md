# Changelog

All notable changes to orc-pack are recorded here. Each version gets one section, and the release guard publishes that section **verbatim** as the GitHub release body. This file is therefore the update map that `/update-orc` and the `orc-updater` agent read — write every entry for an agent that has never seen this repo and may be jumping several versions at once.

## Release-note format (required)

Every released version needs a section headed `## [x.y.z] - YYYY-MM-DD` containing:

- **Summary** — one paragraph on what this release is.
- **Changed areas** — one bullet per area: what changed, the exact files, and what an updater must do about it.
- **Update steps** — anything beyond copying files: provenance, re-vets, CI, environment, migrations.
- **Breaking changes** — an explicit "None" or the list and what it forces.
- **Files to read** — the paths an updater agent must read before applying this release.

The release guard fails and publishes nothing if there is no section for the version being released. That is deliberate: an update with no map is an update an agent cannot safely apply. Entries must stand alone — an updater may skip straight from any older version to this one, so do not write an entry that assumes the reader applied the previous release.

---

## [1.14.0] - 2026-10-07

**Summary.** The pack now ships `/orc-loop`, an unattended batch loop. It plans about five issues (or an epic's sub-issues), lands each with `/orc` (pushed, CI green, closed), then reviews the batch as a whole for what per-issue reviews miss, fixing and rechecking for up to three rounds and filing what survives. It runs under `/loop`, keeps its state in `<git-dir>/orc-loop/`, and draws its progress on paceline's bar when paceline is installed. On its first run in a repo it asks once whether the agents' notes in `.claude/agent-memory/` go in `.gitignore` or get committed, and applies the answer, instead of stopping on them as a dirty tree. A stop before anything was planned now ends with `LOOP NOT STARTED` and a short explanation rather than an empty report. Orc's own dirty-tree guard also ignores `.claude/agent-memory/`, so notes its agents wrote in an earlier run no longer stop the next one.

**Changed areas.**

- **`skills/orc-loop/SKILL.md`** — new skill, user-invoked only (`disable-model-invocation: true`). It dispatches agents the pack already ships (`architecture-reviewer`, `quality-reviewer`, `security-reviewer`, `comment-reviewer`, `ui-reviewer`, `test-coverage-reviewer`, `fallow`, `lint`, `typecheck`, `test`, `verifier`) plus Claude Code's built-in `general-purpose` agent as its planner, and finds orc's references the way orc does. It needs Claude Code's `/loop` skill and `ScheduleWakeup`. Copy it.
- **`skills/orc/SKILL.md`, step 1 guards** — the dirty-tree guard ignores changes under `.claude/agent-memory/`. Refresh.
- **`README.md`** — new **Run a batch unattended: `/orc-loop`** section; **What's in the box** and **Progress on your status line** mention it. Kit docs only.
- **`INSTALL.md`** — the tree, the file mapping, the prune list, and the verify and report counts include `skills/orc-loop/`. Kit docs only.
- **`.github/workflows/pack-integrity.yml`** — the agent-name check also scans `skills/orc-loop/SKILL.md`. Kit CI only.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.14.0`.

**Update steps.** Copy `skills/orc-loop/SKILL.md` to `.claude/skills/orc-loop/SKILL.md`, refresh `skills/orc/SKILL.md`, and move every `pack:` marker to `orc-pack@1.14.0`. If the repo, or the user's `~/.claude/skills/`, already has an `orc-loop` skill that does not carry a `pack:` marker, treat it as repo-owned and route it through conflict handling: never overwrite it silently. A personal copy that drew its bar from `<git-dir>/orc-loop/state.json` through a custom status line now duplicates paceline's bar; tell the user to remove that status-line segment. Don't create or edit `.gitignore` for agent memory during the update; the loop asks on its first run. An install coming from 1.13.0 or earlier also applies `[1.13.1]` and every entry in between.

**Breaking changes.** None.

**Files to read.** `skills/orc-loop/SKILL.md`, and `skills/orc/SKILL.md` (step 1, the dirty-tree guard).

---

## [1.13.1] - 2026-10-06

**Summary.** Orc's paceline bar now has one cell per task plus a final ready cell, so a four-task run draws five cells and the active cell shows where the run is. Fix rounds are stages inside their task's cell (`fix 1` to `fix 3`) rather than extra cells, the step label names what each task builds, the run is named after its issue (`orc #42`), and the ready check and landing have a cell of their own instead of a bare label. When a task is added mid-run, orc skips the old ready step and appends the new tasks and a fresh ready step, so the ready cell stays last.

**Changed areas.**

- **`skills/orc/SKILL.md`, Progress bar section** — new plan shape and update rules: per task `stages` `["build", "review", "fix 1", "fix 2", "fix 3"]` (with `design` first on structural tasks), a descriptive `label` such as `t2 upload limit`, a final `ready` step with `stages` `["check", "land"]`, and the skip-and-re-add rule for new tasks. Refresh.
- **`README.md`** — **Progress on your status line** describes the new bar. Kit docs only.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.13.1`.

**Update steps.** Refresh `skills/orc/SKILL.md` and move every `pack:` marker to `orc-pack@1.13.1`. No new or removed files. An install coming from 1.12.x or earlier also applies `[1.13.0]` and every entry in between.

**Breaking changes.** None. A run started by 1.13.0 that is still on the status line keeps its old shape until the next orc run replaces it.

**Files to read.** `skills/orc/SKILL.md` (Progress bar).

---

## [1.13.0] - 2026-10-06

**Summary.** Orc can now show a run's progress on the Claude Code status line through [paceline](https://github.com/rogadev/paceline), whose `paceline-mcp` server gives agents progress tools. After planning, orc starts a bar with one step per task, weighted by size and moved through each task's stages (design on structural tasks, then build, review, and commit), so the percentage tracks the real work. The integration is optional, and each update rides along with a call orc already makes, so it adds no turns.

**Changed areas.**

- **`skills/orc/SKILL.md`, new Progress bar section** (after **The task list is your spine**) — the calls orc makes at each point of a run, and when it skips the bar: the tools are missing, a call fails, or the invocation says the caller reports its own progress through paceline, which keeps one run per repository. A caller that draws its bar some other way needs no change; both bars show. Refresh.
- **`README.md`** — new **Progress on your status line** section linking to paceline. Kit docs only.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.13.0`.

**Update steps.** Refresh `skills/orc/SKILL.md` and move every `pack:` marker to `orc-pack@1.13.0`. No new or removed files in the install. Installing paceline is optional and outside the pack: put the `paceline` and `paceline-mcp` binaries on the machine, run `paceline install`, and register the server with `claude mcp add --scope user paceline -- /path/to/paceline-mcp`. A skill or loop that invokes `/orc` and reports its own progress through the paceline tools should say so in the invocation, or orc's bar replaces it. An install coming from 1.11.x or earlier also applies `[1.12.0]` and every entry in between.

**Breaking changes.** None. With paceline registered, orc runs now write `<git-dir>/paceline/progress.json` through its MCP server in the repo they work in.

**Files to read.** `skills/orc/SKILL.md` (Progress bar), and paceline's README, section "Progress bar", for the tool and file format.

---

## [1.12.0] - 2026-10-06

**Summary.** Orc now uses Fable 5.1 where it still beats Opus 5.5: the `ui-implementer` runs on Fable for the design brief and first build of a structural UI task, such as a new screen or UI feature, because Fable's open-ended visual design is stronger. Everything else stays on Opus 5.5, which matches or beats Fable on coding at well under half the cost. Round three of a fix loop still runs on Fable, and a round-three fix that weakens a test is now a Blocker. Orc also records what every dispatch costs in a token ledger and reports the run's total, and it skips the verifier in every mode when a review returns only Nits. This release also trims repeated text across the pack, so each agent loads fewer tokens with no rule removed, and fixes several bugs: `fallow` could report a crash as a pass, `dependency-vetter`'s audit failed without a lockfile, `impact` miscounted lines, and the suppression rules contradicted each other.

**Changed areas.**

- **`skills/orc/SKILL.md`, Model selection and 5. Run the task loop** — new Fable rule: `ui-implementer` gets `model: fable` for the brief and first build of a structural task; its fix rounds stay on Opus 5.5. Round three keeps Fable, and a round-three fix that weakens, skips, or deletes a test or assertion is a Blocker. In efficiency mode, structural UI stays on Opus 5.5. The per-agent tier list is replaced by one line naming the non-Opus agents, because each agent's frontmatter holds its model and effort. Refresh.
- **`skills/orc/SKILL.md`, new Token ledger section and 9. Report** — orc appends one tab-separated line per dispatch (date, run, task, size, agent, model, role, tokens, findings raised, findings confirmed) to `.git/orc/token-ledger.tsv`, found with `git rev-parse --git-path`, so it is never committed and persists across runs. The report gains a **Cost** line: the run's subagent tokens, dispatch count, three costliest agents, and the ledger path. Refresh.
- **`skills/orc/SKILL.md`, 5. Run the task loop** — the verifier is skipped in every mode, not only efficiency mode, when a panel returns no findings or only Nits with none tagged Cleanup candidate; those Nits go in the commit body marked unverified. A cleanup audit is always verified. The efficiency-mode question no longer lists this as a trade-off. Refresh.
- **`skills/orc/SKILL.md`, other sections** — shorter **Waiting on subagents**, **Discoveries**, and **What orc does NOT do** (rules stated elsewhere removed, no rule lost). **Ready** and the **Standards** table now allow a suppression only as `code.md` allows it. Refresh.
- **`skills/orc/references/builder-contract.md`** — step 10 defers to `code.md`'s "Suppressions are a last resort" rule instead of banning every suppression; skipped tests, deleted assertions, and `--no-verify` stay banned. Shorter **Standards** list and step 8. Refresh; no `pack:` marker.
- **`agents/fallow.md`** — captures the exit code and stderr instead of discarding them; a new `ERROR` status covers any exit other than 0 or 1 or output that isn't JSON, so a crash is never a PASS. Defines PASS, WARN (dead code, duplication, complexity), and FAIL (a circular dependency). Anything that parses its report must accept `ERROR` and the new `Exit code` line. Refresh.
- **`agents/dependency-vetter.md`** — vets the exact version the caller names, resolving `latest`, another tag, or a range to a concrete version first. Creates the vet directory before entering it, and builds a lockfile (`npm install --package-lock-only --ignore-scripts`, then `npm ci --ignore-scripts`) so `npm audit` works. Refresh.
- **`agents/impact.md`** — counts with `git diff -w --numstat` (one diff against `HEAD` for uncommitted work, plus untracked files), so whitespace-only changes and binary files drop out and per-file counts are exact. Refresh.
- **`agents/security-reviewer.md`** — the output format gains the **Pre-existing** section its rules already asked for. Refresh.
- **`agents/test-coverage-reviewer.md`** — description now covers every change to logic that can regress. Refresh.
- **`skills/orc/references/standards/ui.md` and `agents/ui-reviewer.md`** — 768 px stays a design target; the reviewer renders 390 px and 1440 px and checks the tablet width by reading the code. Refresh.
- **`skills/newissue/SKILL.md`** — writes the issue body to a file and files it with `--body-file`, never a heredoc; the self-check now comes before filing. Refresh.
- **`skills/update-orc/SKILL.md`** — also finds a global install under `~/.claude/` when the project has none; fetches the kit before building the update map. Refresh.
- **Token trims, no rule removed** — `agents/{implementer,ui-implementer,api-implementer,data-implementer,architecture-reviewer,design-reviewer,verifier,typecheck,next-issue-finder,docs-writer,skill-vetter,orc-updater}.md`, `skills/orc/references/{design-brief.md,standards/code.md,standards/comments.md,standards/data.md}`, and every framework and platform playbook. Builders now point to the standards they load instead of restating them. `design-brief.md` gains a **Reversibility** bullet in its Data section. Refresh all.
- **`INSTALL.md`, `UPDATE.md`, `README.md`, `CLAUDE.md`, `docs/model-tiers.md` (new)** — install table uses one row for all agents and lists every kit file that isn't copied; stale statements fixed; the model-tier evidence moved from `CLAUDE.md` to `docs/model-tiers.md`. Kit docs only; don't copy `docs/`.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.12.0`.

**Update steps.** Refresh every skill, agent, and reference file listed above and move every `pack:` marker to `orc-pack@1.12.0`. No new or removed files in the install. Fable 5.1 must be available on the account for the structural UI move; on an account without it, those dispatches may fail, so remove the structural UI rule from **Model selection** there. If the install has local edits to `fallow.md`, keep the new exit-code capture. An install coming from 1.10.x or earlier also applies `[1.11.0]` and every entry in between.

**Breaking changes.** None removed. Orc runs now write `.git/orc/token-ledger.tsv` in the repo they work in, and the report gains a **Cost** line. Structural UI tasks now cost more per build (Fable 5.1 is priced above Opus 5.5). The `fallow` report can now say `Status: ERROR`.

**Files to read.** `skills/orc/SKILL.md` (Token ledger, Model selection, Efficiency mode, 5. Run the task loop, 7. Ready, 9. Report), `skills/orc/references/builder-contract.md` (Build mode step 10), `agents/fallow.md`, `agents/dependency-vetter.md`, `agents/impact.md`, and `docs/model-tiers.md` in the kit for the reasoning.

---

## [1.11.0] - 2026-10-06

**Summary.** Every orc run now works to a written **work contract**, and a new `scope-reviewer` holds each diff to it. Before it plans, orc writes one sentence naming the exact files and symbols it believes the request means, what's in and out of scope, every integration marked real or mocked, its user-facing assumptions, and three to six acceptance criteria that each name a test. Builders write those tests first and show them failing before they write the change, and the report maps each criterion to its passing test. This targets the two costliest failure modes of unattended runs: a wrong approach (for example, a mock where the real API was wanted) and a misread request. `/orc contract first …` adds an approval stop before building. A new optional skill, `/shipcheck`, verifies a pushed commit all the way to the live build: it waits for CI and fixes a red run, checks that the target environment has every required secret, waits until the deployment serves that exact commit, and runs browser smoke checks at phone and desktop widths in both themes. Separately, undirected orc runs stop picking issues that are already fixed: the issue scout checks each candidate against the integration branch's history first, and orc closes the stale ones with evidence.

**Changed areas.**

- **`skills/shipcheck/SKILL.md` (new)** — run after a push. Watches the commit's CI runs with `gh run watch`; on a red run it reproduces the failing command locally, dispatches a builder to fix it, and re-pushes, at most 2 attempts, never onto `main`, `master`, or `production`. Compares the secret names in `.claude/required-secrets.md` with what the target environment has (GitHub Actions, GitHub environments, Vercel, Cloudflare Workers), never reading a value, and stops on any missing name. Proves the deployment serves the pushed SHA before testing. Runs every flow in `.claude/smoke-checklist.md` in Claude in Chrome at 390px and 1440px in light and dark mode, with a screenshot per step. Stops with exact unlock instructions at an SSO, auth, or VPN wall. Turns each confirmed regression into a `fix/<slug>` branch with a reproducing test (pushed, never merged), or an issue with screenshot paths and a root-cause hypothesis. Both `.claude/` files are repo-owned; shipcheck drafts them from the code when they are missing. Copy it in for a copied install.
- **`skills/orc/references/work-contract.md` (new)** — the contract template: restatement, in scope (with pre-approved cleanup: touched-file slop, code the change made dead, a typo beside the change), out of scope, integrations (real by default; **MOCKED** only when asked), assumptions as question and answer, and acceptance criteria with the test that proves each. Pack-owned reference file; copy it with the rest of `references/`.
- **`agents/scope-reviewer.md` (new)** — Opus 5.5 at low effort. Checks a task's diff against the contract: hunks that trace to nothing in it (Warning), criteria with no proving test or a test that passes without the change (Blocker), and mocks or stubs in production paths where the contract says real (Blocker). Copy it in.
- **`skills/orc/SKILL.md`, 3. Make it buildable** — new **Write the contract** step after the ladder: orc writes `<scratchpad>/contract.md`, states the restatement in one line in chat, and posts the contract on the issue as a `Work contract` comment. New **Contract first (opt-in)**: with `contract first` at the start of the invocation, orc asks one approval question before building, takes a change as free text, and builds after at most a second answer. **Preflight** strips the new opt-in words alongside `efficiency mode` and, for `contract first`, stops before touching anything when it can't ask. A batch gets one contract with criteria tagged by issue. **What orc does NOT do** names the two pre-build questions as the only ones. Refresh.
- **`skills/orc/SKILL.md`, 4 and 5** — tasks are decomposed from the contract's criteria, each criterion owned by one task. Builder dispatches carry the owned criteria with their tests and the contract path. `scope-reviewer` is a lane on every standard and structural task, and on a trivial task whose files the contract doesn't name. Reviewers get the contract path. Design-brief and design-review dispatches carry the contract and the task's criteria, and the verifier gets the contract when `scope-reviewer` raised findings. Orc reads each builder's **Acceptance** line first and sends a test that passed before the change straight back. A scope finding is fixed by reverting the change; one worth keeping becomes its own task, and a contract amendment is recorded in the commit body. **Standards** lists `work-contract.md`; **Model selection** lists `scope-reviewer` at low effort. Refresh.
- **`skills/orc/SKILL.md`, Cleanup runs and 6. Discoveries** — a cleanup run completes its contract after the audit, one **In scope** line and one criterion per task, with characterization tests exempt from failing-first. **Keep the contract current**: every task added after the contract (a Small follow-up, a cleanup candidate, a folded-in fix) gets an **In scope** line tagged `follow-up` before it is dispatched, so the scope review doesn't flag it. Refresh.
- **`agents/verifier.md`** — a confirmed departure from the work contract is a broken documented rule, never a Preference, and not Out of scope merely for sitting in a touched file. Refresh.
- **`skills/orc/SKILL.md`, 9. Report** — **Landed** maps each acceptance criterion to its proving test. **Heads-up** leads with any **MOCKED** integration, then the contract's assumptions. Refresh.
- **`skills/orc/references/builder-contract.md`** — build mode writes each acceptance test first and confirms it fails for the right reason, then the change; a new rule forbids mocks in production paths unless the contract marks the integration **MOCKED**; the contract's scope lists are binding; the report gains an **Acceptance** line (each criterion, its test, before and after). Build steps are renumbered 1 to 10. Refresh; no `pack:` marker.
- **`skills/newissue/SKILL.md`** — new **Integrations** section (real or mocked), and **Done when** is now three to six acceptance criteria a test can assert. The self-check covers both. Refresh.
- **`agents/next-issue-finder.md`** — new **Screen out stale candidates** section: two `git log` calls per candidate (by issue number, and by the paths the issue names) and a code read only on a hit. The output block gains an optional `STALE:` section, one line per stale issue with the commit and the code evidence. `PICK: NONE` now also covers a board where every candidate is stale. The agent stays read-only. Refresh.
- **`skills/orc/SKILL.md`, 1. Survey** — orc confirms each `STALE` entry itself, comments the commit and what the code now does, and closes the issue; if the evidence doesn't hold, it leaves the issue alone. Refresh.
- **`.github/workflows/pack-integrity.yml`** — the agent-name check also scans `skills/shipcheck/SKILL.md`, and the reference check covers `work-contract.md`. Kit CI only.
- **`INSTALL.md`, `README.md`, `CLAUDE.md`** — list the new skill, agent, and template (23 agents), describe the contract in the run flow, and a 1.11.0 banner. Kit docs only.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.11.0`.

**Update steps.** Copy the new `agents/scope-reviewer.md` and `skills/orc/references/work-contract.md`; orc dispatches the agent and passes the template by name, so an install without them breaks the review loop. Copy `skills/shipcheck/SKILL.md` to `.claude/skills/shipcheck/SKILL.md` unless the user declines it (it is optional, like `newissue`). Refresh `agents/next-issue-finder.md`, `agents/verifier.md`, `skills/orc/SKILL.md`, `skills/orc/references/builder-contract.md`, and `skills/newissue/SKILL.md`, and move every `pack:` marker to `orc-pack@1.11.0`. Never create or overwrite `.claude/required-secrets.md` or `.claude/smoke-checklist.md`; they are repo-owned. No CI, environment, or dependency changes in the target repo. If the install has local edits to `next-issue-finder.md`, keep the `STALE:` section of its output block: orc reads it. An install coming from 1.9.x or earlier also applies `[1.10.0]` and every entry in between.

**Breaking changes.** No settings or files are removed. Orc runs now post a `Work contract` comment on the issue they work, standard and structural tasks get one more review lane, and builder reports carry a new **Acceptance** line. If the install has local edits to `builder-contract.md`, re-apply them around the renumbered build steps and keep step 4 (tests first) and step 6 (real integrations). Anything that parses the scout's output must tolerate the new optional `STALE:` section between `SET_ASIDE:` and `GUARDS:`.

**Files to read.** `skills/orc/references/work-contract.md`, `agents/scope-reviewer.md`, `skills/orc/references/builder-contract.md` (Build mode, Scope, Report), `skills/shipcheck/SKILL.md`, `agents/next-issue-finder.md` (Screen out stale candidates, Output), and `skills/orc/SKILL.md` (Preflight, 1. Survey, 3. Make it buildable, 4, 5, Cleanup runs, 6. Discoveries, 9. Report, What orc does NOT do), and `agents/verifier.md` (Rules).

---

## [1.10.0] - 2026-10-02

**Summary.** Orc's end-of-run report now separates what the user needs to decide from everything else, and every decision comes with a size. Before this release, **Your call** mixed small fixes orc could have made itself, plain heads-ups, and real decisions in one unsized list, and orc built any discovery larger than trivial in the same run, so a short job could grow into a very long one. Now orc sizes every follow-up as Small, Medium, Large, or Huge. It does Small work during the run and hands Medium and larger work back as a fixed-format card with a size, an impact, a recommendation, the scope of a yes, and the issue status. When the user approves a card, orc states the bound in one line and stops at the approved band. Builders and the verifier tag the out-of-scope items they report with a size, so orc can route them without sizing them again.

**Changed areas.**

- **`skills/orc/SKILL.md`, Discoveries** — new **Follow-up sizes** subsection that defines the four bands once, by scope, never by hours: Small (one task in this run), Medium (one dedicated run of 2 to 4 tasks), Large (several runs, its own issue, usually a spec), and Huge (an epic that needs a plan). These are separate from the task sizes in step 4 (trivial, standard, structural). A Small follow-up becomes its own task in this run and counts toward the run budget. A verification question orc can answer from the repo is answered, not handed back. Medium and larger work becomes a card: not built, and not filed as an issue without the user's consent. Quality debt in files no task touches becomes one card per area, whatever its size. Refresh.
- **`skills/orc/SKILL.md`, The task list is your spine: Run budget and Approved cards (new)** — the budget counts Small follow-ups, and work the cap leaves undone comes back as cards. An invocation that approves a card from an earlier report (for example, `/orc do the negative cache card`) is a directed run: orc finds the card in the session or on the board, states its bound in one line without waiting for a reply, except for a Small card, which gets no echo. A Medium card runs on a 4-task budget; Small, Large, and Huge keep the normal budget, and Large and Huge land a first slice and return the rest as a card. If the work outgrows the band, orc stops at it, lands what is green, and reports the remainder as a new card. Refresh.
- **`skills/orc/SKILL.md`, 9. Report** — the report's sections, in order: **Picked**, **Landed** (which now lists each Small follow-up done during the run and any `Deploy:` line), **Board**, **Heads-up** (new: behavior changes, reversible assumptions, provisional values, and steps that could not run as designed), and **Your call**, which holds only cards in a fixed shape. Every card carries a size and a mandatory **Issue** line in one of four forms: `exists #N`, `exists #N, needs updating with <finding>`, `filed #N`, or `none, recommend filing`. Empty sections and lines that only say there is nothing to report (for example, "Deploy notes: none") are dropped. Refresh.
- **`skills/orc/SKILL.md`, review loop and commit** — the verifier's out-of-scope findings are routed by their size tag. Nits left when the review loop ends go in the task's commit body on a `Nits left:` line, not in the report, and that includes unverified Nits in efficiency mode. A Warning still open after three fix rounds becomes a card. Builders' deploy notes appear as a `Deploy:` line under the matching **Landed** entry as well as in the commit body. Refresh.
- **`skills/orc/SKILL.md`, What orc does NOT do, Outcomes, and other mentions** — "No procrastinating work onto the board" now covers Small work only, and a new rule, **No silent scope growth**, says Medium and larger discoveries are cards. **Outcomes** and the autonomy note, **Preflight**, **Untrusted input**, and **Standards** point to **Heads-up** and cards instead of an unsized **Your call**. Refresh.
- **`skills/orc/references/builder-contract.md`** — the report's **Cleanup targets** and **Out of scope noticed** lines each start with a size (`Small`, `Medium`, or `Large`, for example `Medium - src/lib/billing: ...`), and the contract defines the bands. Huge folds into Large for builders. Refresh; it has no `pack:` marker.
- **`agents/verifier.md`** — every 🧭 Out of scope finding gets a **Size:** field (Small, Medium, or Large; Huge folds into Large), and the verdict table says out-of-scope findings move to the list with their size. Refresh.
- **`UPDATE.md`** — a new rule for re-applied local edits: keep the parts of the reports orc parses (the size at the start of each builder **Cleanup targets** and **Out of scope noticed** line, and the verifier's **Size:** field), and when a local edit conflicts with them, keep the kit's format and report the conflict. Kit docs only.
- **`README.md`** — a 1.10.0 banner (replacing the 1.9.0 one), and the "How a run actually flows" discovery and report steps plus the standards note describe sized follow-ups and cards. Kit docs only.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.10.0`.

**Update steps.** Refresh `skills/orc/SKILL.md`, `skills/orc/references/builder-contract.md`, and `agents/verifier.md`, and move every `pack:` marker to `orc-pack@1.10.0`. No new or removed files, and no CI, environment, or dependency changes. If the install has local edits to `builder-contract.md` or `verifier.md`, re-apply them so the size tags survive: orc routes out-of-scope items by those tags, and it sizes an untagged item itself, which costs it context on every run. An install coming from 1.9.0 also applies the `[1.9.1]` entry below, and one coming from 1.8.0 or earlier also applies `[1.9.0]` and every entry in between.

**Breaking changes.** No settings, files, or invocations change. Orc no longer builds a Medium or larger discovery in the same run; it reports it as a card under **Your call**, so a run that used to grow to cover what it found now lands less and hands back more. To have orc build a card, start a new run that approves it. **Your call** now holds only cards, and leftover Nits move from the report to each task's commit body on a `Nits left:` line. Anything that parses orc's report text, such as a script that reads **Your call** bullets or expects "Nothing." when there is nothing to decide, must handle the new card shape, the new **Heads-up** section, and dropped empty sections.

**Files to read.** `skills/orc/SKILL.md` (**Run budget** and **Approved cards** under The task list is your spine, 6. Discoveries and its **Follow-up sizes**, the review loop and **Commit** in step 5, 9. Report, and What orc does NOT do), `skills/orc/references/builder-contract.md` (Report), and `agents/verifier.md` (Rules and output format).

---

## [1.9.1] - 2026-09-28

**Summary.** A one-paragraph fix to `/update-orc`. It told the dispatcher to pass `model: claude-opus-5-5` to the `orc-updater` agent, but the Agent tool's `model` field accepts only a family alias (`opus`, `sonnet`, `haiku`, or `fable`), so the instruction could not be followed as written. 1.9.0 fixed the same problem in the `orc` skill and missed this copy. `/update-orc` now dispatches `orc-updater` with no `model`, so the agent's frontmatter pins it to Opus 5.5.

**Changed areas.**

- **`skills/update-orc/SKILL.md`** — step 5 dispatches `orc-updater` without a `model` parameter and explains why an `opus` alias is still avoided. Refresh.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.9.1`.

**Update steps.** Refresh `skills/update-orc/SKILL.md`, and move every `pack:` marker to `orc-pack@1.9.1`. Nothing else. An install coming from 1.8.0 or earlier also applies the `[1.9.0]` entry below.

**Breaking changes.** None.

**Files to read.** `skills/update-orc/SKILL.md` (step 5).

---

## [1.9.0] - 2026-09-28

**Summary.** Claude Sonnet 5.5 shipped, and this release fits it into the pack. `test-coverage-reviewer` moves from Sonnet 5 to Sonnet 5.5: it costs the same, and on CodeRabbit's 13 hard review cases it caught 6 known issues to Sonnet 5's 4 at under half the cost per review. Every other agent keeps its model: at the medium and low effort most of them run, Sonnet 5.5 scores well below Opus 5.5, and the high-effort agents do security work or irreversible data changes, where Opus 5.5 is the safer model. Orc also gains **efficiency mode**: starting `/orc` on Sonnet 5.5 asks the user to confirm, then runs with a slightly lower token bill by moving three smaller jobs to Sonnet 5.5, handing more decisions to Opus agents, and skipping the verifier when reviews find only Nits. Starting on Opus 5.5 works as before, with one fix that applies to every run: orc now dispatches through the Agent tool's family aliases, the only values its `model` field accepts, instead of exact model ids.

**Changed areas.**

- **`agents/test-coverage-reviewer.md`** — `model: claude-sonnet-5` becomes `model: claude-sonnet-5-5`; `effort: high` is unchanged. Refresh. If the installed copy pins a different model on purpose, keep the local choice and say so in the report.
- **`skills/orc/SKILL.md`, Preflight** — sorts the session model into cases: Opus 5.5 and other capable models start straight away, Sonnet 5.5 asks the user to confirm efficiency mode with `AskUserQuestion` (fixed question text), and Opus 5 is still refused. An invocation that starts with `efficiency mode` answers the question in advance on Sonnet 5.5 and is ignored, with a note, on other models. Preflight now also checks `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` before the run, and a preflight stop prints no status line. Refresh.
- **`skills/orc/SKILL.md`, Model selection** — corrects how orc picks subagent models. The Agent tool's `model` takes only `opus`, `sonnet`, `haiku`, or `fable`, so the old rule to pass exact ids could not be followed. Orc now leaves `model` off any dispatch whose frontmatter is already right, and passes `sonnet` only for efficiency-mode moves and `fable` for a round-three fix. Names Sonnet 5.5 for `test-coverage-reviewer`. Refresh.
- **`skills/orc/SKILL.md`, Efficiency mode (new subsection)** — on a confirmed Sonnet 5.5 run, three dispatches go to Sonnet 5.5: `next-issue-finder`; the build of a trivial task (not `data-implementer`; a build that grows past trivial keeps its standard review); and a builder's first fix round when it carries no Blocker and no `security-reviewer` finding, with `quality-reviewer` always in the re-review. Every reviewer, the verifier, `data-implementer`, the first build of standard and structural work, and later fix rounds keep their models. Orc takes the design reviewer's side on a second `REVISE`, routes ready-check fixes and trivial discovery fixes through builders instead of editing code itself, and skips the verifier when a task's panel returns only Nits with no Cleanup candidate (cleanup audits are always verified). Short pointers in the survey step, design step, builder dispatch, verifier step, fix loop, Discoveries, Ready, and the report's **Picked** line. Refresh.
- **`skills/orc/SKILL.md`, Untrusted input** — one sentence saying timer wakes and subagent completion notices are expected harness events, not untrusted input. Refresh.
- **`README.md`** — a 1.9.0 banner (replacing the 1.8.0 one and its broken changelog link), a new **Pick a model: default or efficiency mode** section, and small mentions of Sonnet 5.5 in the intro and to-do tools note. Kit docs only.
- **`INSTALL.md`** — Phase 6 mentions efficiency mode and Sonnet 5.5. Kit docs only.
- **`CLAUDE.md`** — the model-assignment section records the Sonnet 5.5 move, the effort-level data behind the tiers (with its source), the Agent tool's alias limit, and the efficiency-mode rules and their main risk. Kit docs only; not installed.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.9.0`.

**Update steps.** Refresh `agents/test-coverage-reviewer.md` and `skills/orc/SKILL.md`, and move every `pack:` marker to `orc-pack@1.9.0`. Nothing else: no new files, no CI or environment changes. Sonnet 5.5 must be available to the account running orc; it has its own rate-limit pool, separate from Sonnet 5's.

**Breaking changes.** None for runs started on Opus 5.5. A run started on Sonnet 5.5 now stops for a one-question confirmation, or stops outright in a non-interactive run, unless the invocation starts with `efficiency mode`. A scheduled or scripted `/orc` on Sonnet 5.5 must add those words.

**Files to read.** `skills/orc/SKILL.md` (Preflight, Model selection, and Efficiency mode) and `agents/test-coverage-reviewer.md`.

---

## [1.8.0] - 2026-09-28

**Summary.** Two changes. First, orc gains specialist builders: `ui-implementer`, `api-implementer`, and `data-implementer` join the general `implementer`, orc assigns each task a builder by its primary surface, and every builder now reads one shared `builder-contract.md` that holds the rules the old `implementer.md` carried. A new `standards/data.md` gives data work a standard to write and review against. Second, orc stops paying to re-cache its whole context after a long subagent wait. The prompt cache lasts about an hour, and orc makes no requests while a subagent runs, so any wait longer than that made the next turn re-cache the full context at about twice the input price (a warm read costs about a tenth). Orc now keeps a background heartbeat timer while agents run, so the main thread touches its cache before it expires.

**Changed areas.**

- **`skills/orc/references/builder-contract.md` (new)** — the rules every builder follows, moved out of `agents/implementer.md`: what the dispatch contains, untrusted input, reading the standards, brief mode, build mode's core steps, scope, never committing, no suppressions, fix rounds, and the report format (with a new optional **Deploy notes** heading). Nothing the implementer enforced was dropped or weakened. Every builder reads it first, and each builder's agent file repeats the hard rules (no commits, no suppressions, scope, tests with exact output) in case the contract cannot be read. No `pack:` marker; it is pack-owned like the rest of `references/`. Copy in.
- **`skills/orc/references/standards/data.md` (new)** — migrations, expand/contract changes, locks on large tables, backfills, indexes, query safety, destructive operations and environments, and the slop signatures of data code. Read by `data-implementer` (and any builder whose task touches schema, migrations, or queries), `design-reviewer` on data briefs, and `architecture-reviewer` when a diff touches schema or migrations. Copy in.
- **`agents/implementer.md`** — rewritten as a thin general builder. It reads the contract, then carries judgement for its lane: tooling, config, scripts, docs-adjacent code, cross-cutting changes, and cleanup runs. It stays the fallback for any task orc cannot route. Same model and effort (Opus 5.5, medium). Refresh, then see **Update steps** for local edits.
- **`agents/ui-implementer.md` (new)** — components, pages, layouts, styles, tokens, client state and interaction, and user-facing copy. Always reads `standards/ui.md`; builds on the repo's design system and tokens, every state, keyboard and screen-reader support, phone width, and every theme; always reports **UI surfaces** for `ui-reviewer`. Opus 5.5, medium effort. Copy in.
- **`agents/api-implementer.md` (new)** — routes, endpoints, loaders and actions, services, integrations, and background jobs. Boundary validation with the repo's library, consistent error contracts, authorization at the right layer, idempotent retried writes, bounded upstream calls, no secrets or personal data in logs, contract-level tests, and no silent break of external callers. Always reports **Deploy notes**. Opus 5.5, medium effort. Copy in.
- **`agents/data-implementer.md` (new)** — schema changes, migrations, backfills, seed data, ORM models, indexes, and heavy query changes. Uses the repo's migration tool, reversible migrations, expand/contract for live tables, batched and resumable backfills, lock awareness, and indexes matched to real queries. It never runs a migration or backfill against anything but a local or test database, and always reports the deploy order under **Deploy notes**. Opus 5.5, **high** effort, because its mistakes are the hardest to reverse. Copy in.
- **`skills/orc/SKILL.md`** — step 4 now assigns each task a builder by its primary surface, with a routing table (`ui-implementer`, `api-implementer`, `data-implementer`, and `implementer` for everything else); a task spanning surfaces is split, or routed to its riskiest surface (data over API over UI). Step 5 dispatches the task's assigned builder in brief mode, build mode, fix rounds (same builder type), and the round-three Fable 5.1 escalation, and still never runs builders in parallel. The **Standards** table adds `builder-contract.md` and `standards/data.md` and names the builders that read each file. **Model selection** lists every builder.
- **`skills/orc/SKILL.md`** — new **Waiting on subagents** section. Before ending a turn to wait on a subagent, orc starts a background timer of about 50 minutes (for example, `sleep 3000`). Each wake reads the still-warm cache, re-arms the timer if agents are still running, and ends. Orc stops the timer when the last agent finishes.
- **`skills/orc/references/standards/code.md`, `comments.md`, `structure.md`, and `ui.md`** — the "who writes to this" line names the builders instead of "the implementer". Refresh.
- **`skills/orc/references/design-brief.md`** — names the task's builder as the author, adds a **partial** state and a **Client state** line to the UI section, and adds a **Data** section (schema change, readers and writers, phases, backfill, locks and indexes, deploy order). Refresh.
- **`agents/design-reviewer.md`** — reads `data.md` for data work and gains a **Data** checklist for briefs with a Data section. Refresh.
- **`agents/architecture-reviewer.md`** — reads `data.md` when the diff touches schema, migrations, or data queries. Refresh.
- **`agents/quality-reviewer.md`** — one-word wording change from "implementer" to "builder". Refresh.
- **`agents/orc-updater.md`** — the conflict-handling pointer now names `INSTALL.md` Phase 3 (it wrongly named `UPDATE.md` Phase 3). Refresh.
- **`.github/workflows/pack-integrity.yml`** (kit CI only, not installed) — check 2 recognizes `*-implementer` agent names, and check 4 verifies `builder-contract.md` exists.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.8.0`.

**Update steps.**

- Copy in the three new agents and the two new reference files. If the repo already has its own agent named `ui-implementer`, `api-implementer`, or `data-implementer` with no `pack:` marker, route it through `INSTALL.md` Phase 3 conflict handling.
- Refresh `skills/orc/SKILL.md`, and re-apply any repo-local edits the install's history shows.
- **Local edits to `agents/implementer.md` need a new home.** Most of the old implementer's body now lives in `builder-contract.md`. For each local edit the install's history shows on `implementer.md`, decide where it belongs: an edit to a rule every builder follows (the dispatch, standards, brief or build steps, scope, commits, suppressions, fix rounds, the report) goes into `.claude/skills/orc/references/builder-contract.md`, so every builder gets it; an edit specific to one kind of work goes into that builder's agent file; an edit about tooling, config, scripts, or cleanup stays in `implementer.md`. Report each edit and where you put it.
- Update the `pack:` marker on every agent and skill file to `orc-pack@1.8.0`.
- The heartbeat needs the main session to run a background shell command that wakes it on exit. Claude Code's Bash tool with `run_in_background` does this. No re-vet, CI, or environment change is required.

**Breaking changes.** None for a clean install. An install with local edits to `agents/implementer.md` must re-home them as described in **Update steps**, or those edits stop applying to UI, API, and data tasks. Long runs show a short heartbeat turn about every 50 minutes while agents work.

**Files to read.** `skills/orc/references/builder-contract.md`, `agents/implementer.md`, `agents/ui-implementer.md`, `agents/api-implementer.md`, `agents/data-implementer.md`, `skills/orc/references/standards/data.md`, and `skills/orc/SKILL.md` (step 4's builder routing, step 5, **Standards**, **Model selection**, and **Waiting on subagents**).

---

## [1.7.0] - 2026-09-22

**Summary.** Raises orc's quality bar and makes it cheaper to hold. A new set of shared standards files (code, comments, structure, and UI) plus detection-gated framework and platform playbooks (Next.js, Nuxt, SvelteKit, Astro, Cloudflare, Vercel) now live beside the orc skill. The implementer writes to them and every reviewer checks against them. Three new reviewers join the panel: `design-reviewer` approves a design brief before code is written for structural tasks, `comment-reviewer` applies a cold-read test to every comment in touched files, and `ui-reviewer` checks UI changes against the design system and, when the app runs locally, reviews screenshots of the rendered screens. Orc now sizes each task (trivial, standard, or structural) and dispatches only the reviewers the task's size and surfaces call for. The verifier gains a "preference" verdict so reviewers' taste never costs a fix round. A new cleanup mode (`/orc clean up the slop in <path>`) runs behavior-preserving refactors of slop code and comments. `quality-reviewer` and `architecture-reviewer` move to Opus 5.5.

**Changed areas.**

- **`skills/orc/references/` (new directory)** — the standards orc passes to its agents: `standards/code.md`, `standards/comments.md`, `standards/structure.md`, `standards/ui.md`, `frameworks/next.md`, `frameworks/nuxt.md`, `frameworks/sveltekit.md`, `frameworks/astro.md`, `platforms/cloudflare.md`, `platforms/vercel.md`, and the `design-brief.md` template. Copy the whole directory to `<root>/.claude/skills/orc/references/`. These files carry no `pack:` marker; they belong to the orc skill directory, which is pack-owned.
- **`agents/design-reviewer.md` (new)** — reviews a structural task's design brief before implementation. Opus 5.5, medium effort. Copy in.
- **`agents/comment-reviewer.md` (new)** — the cold-read test, JSDoc on exports, and slop comments, across every comment in a touched file. Opus 5.5, low effort. Copy in.
- **`agents/ui-reviewer.md` (new)** — design system, hierarchy, states, interaction, responsive, accessibility, and copy, plus an optional visual pass through the repo's own Playwright. It never installs packages or browsers. Opus 5.5, medium effort. Copy in.
- **`agents/quality-reviewer.md`** — rewritten around readability and the AI slop code signatures. Accessibility and design-system checks move to `ui-reviewer`, comments move to `comment-reviewer`, and the stale reference to a non-existent "duplication reviewer" is gone. `model: claude-opus-5-5`, `effort: medium` (was `claude-sonnet-5`, `high`). Refresh.
- **`agents/architecture-reviewer.md`** — adds separation of concerns, file and folder structure, and design-brief conformance. `model: claude-opus-5-5`, `effort: medium` (was `claude-sonnet-5`, `high`). Refresh.
- **`agents/implementer.md`** — gains a `brief` mode that writes a design brief without touching the repo, reads the standards before building, cleans up slop in the files it touches (behavior-preserving), and reports UI surfaces and cleanup candidates. Refresh.
- **`agents/verifier.md`** — new 🎨 Preference and 🧭 Out-of-scope verdicts, and a "does the fix make the code genuinely better" check. Refresh.
- **`agents/security-reviewer.md`, `agents/test-coverage-reviewer.md`, `agents/docs-writer.md`** — read the playbooks or standards they are given. The test-coverage reviewer gains a cleanup mode that pins current behavior with characterization tests. Refresh.
- **Review scope for `quality-reviewer`, `architecture-reviewer`, and `comment-reviewer`** — pre-existing slop in a file the diff touches is now in scope and fixed in the task, tagged **(touched file)**. A touched file that needs more than the task can fix proportionately is raised once as a **Cleanup candidate** and becomes its own task. Quality debt in untouched files is a **cleanup target**, listed in the report for a later run. `comment-reviewer` requires JSDoc only on exports the diff adds or changes; older undocumented exports are cleanup work.
- **`skills/orc/SKILL.md`**:
  - New **Standards** section: how orc finds `references/` (the skill's base directory, then a glob fallback) and which files go to which agent.
  - Step 1 detects the framework, deploy target, and UI to resolve the standards set.
  - Step 4 sizes every task: trivial, standard, or structural.
  - Step 5 adds the design-brief step for structural tasks, replaces reviewer selection with a size and surface routing table, skips the verifier when the panel returns no findings, runs fix rounds on Blockers or Warnings (never on Nits alone), and requires commit subjects that name the change rather than the review process.
  - New **Cleanup runs** section and a **Directed — cleanup** mode.
  - **Discoveries** no longer chases quality debt in untouched files; those files are listed under **Your call** as cleanup targets.
  - **Model selection** updated to the new tiers, and a new **No make-work** rule.
  - Commits stage exactly the task's files with `git add -- <files>` instead of relying on whatever is staged.
  - Fixes the review diff recipe. It was `git diff <base> HEAD`, which is empty because the implementer never commits; it is now `git add --intent-to-add .` followed by `git diff <base>`, so new files appear too.
- **`.github/workflows/pack-integrity.yml`** — new check 4: every standards file and playbook the orc skill names must exist under `skills/orc/references/`.
- **`INSTALL.md`, `UPDATE.md`, `skills/update-orc/SKILL.md`, `agents/orc-updater.md`** — the new reference files carry no `pack:` marker, so every install and update procedure now treats files under `skills/orc/references/` as pack-owned: refreshed from the kit, local edits re-applied, and dropped files removed. Without this, a later update would route them into conflict handling as repo-owned files.
- **`README.md`, `CLAUDE.md`** — layout, agent table, standards, and model tiers updated.

**Update steps.**

- Copy the new `skills/orc/references/` directory in full, and the three new agent files.
- Refresh every other agent file and `skills/orc/SKILL.md`. If a repo-local edit changed `quality-reviewer` or `architecture-reviewer`'s `model:` or `effort:` lines, keep the local choice.
- A repo that wants its own house rules to beat the pack's standards needs no change: every standards file already defers to the repo's `CLAUDE.md`/`AGENTS.md` and established patterns. To tune the standards for one repo, edit that install's copies under `.claude/skills/orc/references/` and record the edit in provenance.
- `ui-reviewer`'s visual pass uses Playwright only when the repo already has it with browsers installed. Nothing new is installed or vetted.
- No re-vet, CI, or environment change is required in the target repo.

**Breaking changes.** None to invocation or outcomes. Behavior changes to expect:

- Reviews are stricter on readability, comments, and structure, and pre-existing slop in touched files is now fixed in the task, so diffs can be larger than before.
- Fix rounds now run on verified Warnings as well as Blockers.
- A cleanup audit that finds nothing ends `FINISHED (no build)`.
- Structural tasks add two dispatches (a brief and its review) before implementation.
- Cost moves up for the two reviewers that moved to Opus 5.5, and down for trivial tasks, which now get a single reviewer and skip the verifier when it finds nothing.

**Files to read.** `skills/orc/SKILL.md` (**Standards**, step 1, steps 4 and 5, **Cleanup runs**, **Discoveries**, and **Model selection**), every file under `skills/orc/references/`, `UPDATE.md`, `agents/implementer.md`, `agents/design-reviewer.md`, `agents/comment-reviewer.md`, `agents/ui-reviewer.md`, `agents/quality-reviewer.md`, `agents/architecture-reviewer.md`, and `agents/verifier.md`.

---

## [1.6.1] - 2026-09-22

**Summary.** Moves the three routine reviewers back to Sonnet 5 and lowers the verifier's effort. Security review and verification stay on Opus 5.5. The routine reviewers only need to not miss real problems, because the Opus 5.5 verifier filters out their false positives. Keeping them at `high` effort on Sonnet 5 costs less per task without weakening the security path.

**Changed areas.**

- **`agents/architecture-reviewer.md`, `agents/quality-reviewer.md`, `agents/test-coverage-reviewer.md`** — `model: claude-sonnet-5`, `effort: high` (were `claude-opus-5-5`, `medium`). Refresh.
- **`agents/verifier.md`** — `effort: medium` (was `high`); model unchanged (`claude-opus-5-5`). Refresh.
- **`skills/orc/SKILL.md`** — **Model selection** now lists the routine reviewers on Sonnet 5 and requires that security review and verification always stay on Opus 5.5. Refresh.
- **`CLAUDE.md`, `README.md`** — tier descriptions updated to match. Refresh `README.md` if the install carries it.

**Update steps.**

- Refresh the four agent files and `skills/orc/SKILL.md`. If a repo-local edit changed one of those agents' `model:` or `effort:` lines, keep the local choice.
- Sonnet 5 (`claude-sonnet-5`) must be available to the account or platform.
- No re-vet, CI, or environment change is required.

**Breaking changes.** None.

**Files to read.** `skills/orc/SKILL.md` (**Model selection**), `CLAUDE.md` (**Model assignments are intentional**), and the frontmatter of the four changed agents.

---

## [1.6.0] - 2026-09-22

**Summary.** Re-tiers every agent for Claude Opus 5.5 (`claude-opus-5-5`, released 2026-09-22). Every agent that makes a judgement call now runs on Opus 5.5, and a new `effort:` frontmatter line sets how hard each one thinks. The Sonnet tier is gone: on the Artificial Analysis Intelligence Index, Opus 5.5 at `low` effort (42) outscores Sonnet 5 at `max` (38). Opus 4.8 is no longer used anywhere. The Opus 5 ban now names only the 5.0 release (`claude-opus-5`), and orc recommends Opus 5.5 as the model to run it on. The five command runners stay on Haiku.

**Changed areas.**

- **`agents/*.md` (frontmatter)** — new `model` and `effort` values. Refresh every agent file.
  - `claude-opus-5-5`, `effort: high`: `security-reviewer`, `verifier`, `skill-vetter`, `dependency-vetter`, `orc-updater` (was Opus 4.8).
  - `claude-opus-5-5`, `effort: medium`: `implementer`, `architecture-reviewer`, `quality-reviewer`, `test-coverage-reviewer` (were `sonnet`).
  - `claude-opus-5-5`, `effort: low`: `next-issue-finder`, `docs-writer` (were `haiku`).
  - Unchanged, `haiku`, no `effort` line: `lint`, `typecheck`, `test`, `impact`, `fallow`.
- **`agents/orc-updater.md`** — the description now says it runs on Opus 5.5.
- **`skills/orc/SKILL.md`**:
  - The preflight blocks only Opus 5 (`claude-opus-5`) and tells the user to switch to `claude-opus-5-5`.
  - **Model selection** puts judgement agents on Opus 5.5, command runners on Haiku, and the round-three implementer on Fable 5.1 (`claude-fable-5-1`) when a blocking finding survives two fix rounds. It requires explicit model ids, because Claude Code runs an `opus` alias subagent on the session's own model when that model is also an Opus.
  - A new rule under **This run is autonomous** tells orc never to end a turn with a status summary while work remains. Opus 5.5 sometimes ends turns that way in unattended runs, which stops the run.
- **`skills/update-orc/SKILL.md`** — dispatches `orc-updater` with `model: claude-opus-5-5` (was `claude-opus-4-8`).
- **`README.md`, `INSTALL.md`, `CLAUDE.md`** — model recommendation, tier descriptions, and to-do-tool notes updated for Opus 5.5.

**Update steps.**

- Refresh every file under `<root>/.claude/agents/` and `<root>/.claude/skills/` from the kit. If a repo-local edit changed an agent's `model:` line, keep the local choice but add the kit's `effort:` line under it.
- The `effort:` frontmatter field needs a Claude Code version that supports it for subagents. Older versions ignore it, and the agent runs at its model's default effort (`medium` on Opus 5.5).
- Opus 5.5 must be available to the account or platform. If it isn't, set the agents' `model:` to the best available model and note the change in provenance.
- No re-vet, CI, or environment change is required.

**Breaking changes.** None to behavior contracts. Cost profile changes: the judgement agents move from Sonnet 5 ($2 / $10 per million input / output tokens) to Opus 5.5 ($4 / $20), offset by effort levels tuned per agent. The scout and `docs-writer` move off Haiku.

**Files to read.** `skills/orc/SKILL.md` (**Preflight** and **Model selection**), `CLAUDE.md` (**Model assignments are intentional**), and the frontmatter of every file in `agents/`.

---

## [1.5.0] - 2026-09-21

**Summary.** Removes the CodeGraph integration from the pack. CodeGraph proved unreliable in practice — it caused failures and its structural answers were not dependable enough to justify the agent, the CLI install, and the supply-chain vet it carried. orc no longer dispatches a `codegraph` agent, the pack no longer installs or vets the CLI, and a fresh install has nothing to do with CodeGraph. `fallow` is unchanged and stays a default-installed, vetted tool.

**Changed areas.**

- **`agents/codegraph.md` (removed)** — the agent is gone. Delete `<root>/.claude/agents/codegraph.md` from an existing install.
- **`skills/orc/SKILL.md`** — `codegraph` removed from the review panel, from step 7's affected-tests scoping, and from the Haiku tooling-runner list. Refresh.
- **`agents/dependency-vetter.md`** — no longer names CodeGraph or its known-good record; the vet now covers `fallow` (and any future third-party tool) on the same install-latest-after-vet policy. Refresh.
- **`agents/orc-updater.md`** — the update-steps bullet now says "re-vet fallow if named" rather than CodeGraph/fallow. Refresh.
- **`.claude-plugin/codegraph.known-good.json` (removed)** — the install-latest-after-vet record for CodeGraph is gone. It is kit config that was never copied into an install, so an install has nothing to delete.
- **`.github/workflows/codegraph-vet.yml` (removed)** — the release canary for CodeGraph is gone. Only relevant if the repo carries the pack's own CI.
- **`.github/workflows/pack-integrity.yml`** — `codegraph` dropped from the known agent-name list. Refresh if the repo carries this CI.
- **`README.md`, `INSTALL.md`, `UPDATE.md`, `CLAUDE.md`** — CodeGraph documentation, install phase, and update phase removed; `fallow` is the remaining third-party tool. Refresh.

**Update steps.**

- **Delete the CodeGraph agent from the install**: `<root>/.claude/agents/codegraph.md`. Do not leave it behind — orc no longer dispatches it, so a stale copy is dead weight that misleads the next reader.
- Remove any CodeGraph entry from `<root>/.claude/orc-pack.provenance.md` (installed version, integrity hash, vet verdict).
- Nothing installs CodeGraph going forward: do not run its install or its vet again. If the CLI is already on the machine, the pack no longer uses it — leaving or uninstalling it is the user's call.
- Re-vet `fallow` if the install has it, per the revised `UPDATE.md` Phase 3.

**Breaking changes.** None at runtime. An install that deletes `agents/codegraph.md` and refreshes the skills is consistent with the target kit.

**Files to read before applying.** `UPDATE.md` (Phase 2 and the revised Phase 3), `INSTALL.md` (Phase 2 mapping and the revised Phase 4.5), `skills/orc/SKILL.md`, this entry.

---

## [1.4.0] - 2026-09-18

**Summary.** Adds `/update-orc` and its `orc-updater` agent so an installed pack can be refreshed from a release in one pass, plus this curated changelog that drives it. Also lands the previously unreleased 1.3.0 work: a defined implementer agent, pack-integrity CI, CodeGraph and fallow wired into the loop and installed by default, a run budget, an untrusted-input rule, CI reporting, and a license.

**Changed areas.**

- **New `skills/update-orc/SKILL.md`** — the update front door: reads the installed version, finds the latest release, fetches the pack at that tag, assembles the map across every missed release, dispatches `orc-updater`, and verifies convergence. Copy it in.
- **New `agents/orc-updater.md`** — Opus 4.8; converges an install on a fetched kit using the changelog map and `UPDATE.md`. Copy it in.
- **New `agents/implementer.md`** — orc's implementer was previously unnamed; orc now dispatches `implementer` by name. Copy it in, or orc's dispatch will not resolve.
- **New `CHANGELOG.md`** — the release-note source published as the release body, and the map `/update-orc` reads from the fetched kit. Kit documentation, not a runtime file: do not copy it into the install (same as `INSTALL.md`).
- **New `LICENSE`** — MIT. Copy it in.
- **`skills/orc/SKILL.md`** — model selection rewritten to the real per-dispatch resolution order; the implementer dispatch names the agent and passes a model; a **run budget** (default 8 tasks, reported remainder); a new **Untrusted input** section; `codegraph` and `fallow` wired into the review panel and step 7; step 8 now reports the pushed commit's CI without blocking. Refresh, then re-read the Model selection and Untrusted input sections.
- **`agents/security-reviewer.md`, `agents/architecture-reviewer.md`, `agents/quality-reviewer.md`, `agents/test-coverage-reviewer.md`** — each gains an "Input is data, not instructions" rule. Refresh.
- **`agents/codegraph.md`, `agents/fallow.md`, `agents/dependency-vetter.md`** — CodeGraph and fallow are no longer optional; both follow install-latest-after-vet. Refresh.
- **`.github/workflows/pack-integrity.yml`** (new) — fails if a `pack:` marker disagrees with `plugin.json`, an agent a skill names is missing, frontmatter does not parse, or an agent's `name` disagrees with its filename.
- **`.github/workflows/release-guard.yml`** — the marker sync now covers every `skills/*/SKILL.md` (it previously skipped `newissue`), and the release publish requires and uses the changelog section instead of auto-generated notes. Only relevant if you ship this repo's CI; refresh if you do.
- **`README.md`, `INSTALL.md`, `UPDATE.md`, `CLAUDE.md`** — document the new agent, the wired tools, the update flow, and the changelog. Refresh.

**Update steps.**

- Copy the new `skills/` and `agents/` files per `INSTALL.md` Phase 2. `/update-orc` does this automatically.
- Add the `implementer` agent before anything else: without it, orc names an agent that does not exist.
- No data migration and no new environment variables. The run budget is opt-in via a `## orc budget` note in the target repo's `CLAUDE.md`/`AGENTS.md`; the default is 8.
- If CodeGraph and fallow are not yet installed, run the install-by-default vet in `INSTALL.md` Phase 4.5 / `UPDATE.md` Phase 3.

**Breaking changes.** None at runtime. The new `pack-integrity.yml` requires every `pack:` marker to equal `plugin.json`; this release is already consistent, so it only bites future drift.

**Files to read before applying.** `UPDATE.md`, `INSTALL.md` (Phase 2 mapping and Phase 4.5), `skills/orc/SKILL.md`, this entry.

---

## [1.2.1] - 2026-08-25

**Summary.** Adds the CodeGraph integration with a vetted install, the repo's `CLAUDE.md`, and the release-publish CI.

**Changed areas.**

- `agents/codegraph.md` (new) and `agents/dependency-vetter.md` (new) — CodeGraph impact queries and the supply-chain vet that gates its install.
- `.claude-plugin/codegraph.known-good.json` (new) — the install-latest-after-vet record with the known-good fallback.
- `.github/workflows/codegraph-vet.yml` (new) and `release-guard.yml` — the vet canary and the release publish.
- `INSTALL.md` and `UPDATE.md` — the CodeGraph phases.
- `CLAUDE.md` (new) — repo guidance for future agents.

**Update steps.** Copy the new agent files. `codegraph` self-skips until a vetted CLI is installed; nothing else depends on it.

**Breaking changes.** None.

**Files to read.** `INSTALL.md` Phase 4.5, `UPDATE.md` Phase 3.

---

## [1.2.0] - 2026-08-24

**Summary.** Orc now handles Discoveries in-flight rather than filing them by default.

**Changed areas.** `skills/orc/SKILL.md` — the Discoveries section and "What orc does NOT do" now bias toward doing the work in the run over filing an issue.

**Update steps.** None beyond refreshing the skill.

**Breaking changes.** None.

---

## [1.1.1] - 2026-08-21

**Summary.** Reframes the model guidance around Opus 5 as the exception, backed by the hallucination benchmark and a reviewer concession.

**Changed areas.** `skills/orc/SKILL.md` (Preflight, Model selection) and `README.md` — the Opus 5 gate and the evidence behind it.

**Update steps.** None beyond refreshing.

**Breaking changes.** None.

---

## [1.1.0] - 2026-08-21

**Summary.** Adds the `/newissue` skill.

**Changed areas.** `skills/newissue/SKILL.md` (new) — turns a rough idea into a self-contained, board-ready issue; orc's Discoveries step uses it for genuine follow-ups.

**Update steps.** Copy the new skill in, or drop it if the repo has its own issue-filing flow.

**Breaking changes.** None.

---

## [1.0.0] - 2026-08-21

**Summary.** Initial release: the `/orc` orchestrator, its reviewer team, the verifier, the tooling runners, and the install/update docs. Packaged as a Claude Code plugin marketplace.

**Changed areas.** Initial pack — `skills/orc/SKILL.md`, 13 agents, `INSTALL.md`, `UPDATE.md`, and the release-guard workflow.

**Update steps.** Initial install.

**Breaking changes.** None.
