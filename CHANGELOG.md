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
