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

## [1.8.0] - 2026-09-25

**Summary.** Stops orc from paying to re-cache its whole context after a long subagent wait. The prompt cache lasts about an hour, and orc makes no requests while a subagent runs, so any wait longer than that made the next turn re-cache the full context at about twice the input price (a warm read costs about a tenth). Orc now keeps a background heartbeat timer while agents run, so the main thread touches its cache before it expires.

**Changed areas.**

- **`skills/orc/SKILL.md`** — new **Waiting on subagents** section. Before ending a turn to wait on a subagent, orc starts a background timer of about 50 minutes (for example, `sleep 3000`). Each wake reads the still-warm cache, re-arms the timer if agents are still running, and ends. Orc stops the timer when the last agent finishes.
- **Every skill and agent file** — `pack:` marker moved to `orc-pack@1.8.0`. No other agent content changed.

**Update steps.**

- Refresh `skills/orc/SKILL.md`, and re-apply any repo-local edits the install's history shows.
- Update the `pack:` marker on every agent and skill file to `orc-pack@1.8.0`; their bodies are unchanged.
- The heartbeat needs the main session to run a background shell command that wakes it on exit. Claude Code's Bash tool with `run_in_background` does this. No re-vet, CI, or environment change is required.

**Breaking changes.** None. Long runs show a short heartbeat turn about every 50 minutes while agents work.

**Files to read.** `skills/orc/SKILL.md` (**Waiting on subagents**).

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
