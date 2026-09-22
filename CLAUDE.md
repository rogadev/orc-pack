# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`orc-pack` is a **source pack** you integrate into your larger projects — it distributes `/orc` (an autonomous, subagent-driven development orchestrator) plus the team of subagents it dispatches. It reaches a project one of two ways: installed as a Claude Code plugin (this repo is also its own plugin marketplace), or copied into that project's `.claude/`. Either way the pack runs _inside those projects_, never in place here. There is no application code in this repo: every deliverable is a Markdown prompt (`skills/*/SKILL.md`, `agents/*.md`, and the reference files under `skills/orc/references/`) that ships elsewhere. "Editing the product" means editing prompt text, not code.

Read `README.md` for the user-facing behavior of `/orc` and `INSTALL.md` (written for an AI agent) for how the pack gets copied into a target repo.

## Layout

- `skills/orc/SKILL.md` — the orchestrator prompt. The core deliverable.
- `skills/orc/references/` — the standards orc hands its agents by path: `standards/` (code, comments, structure, ui), `frameworks/` (next, nuxt, sveltekit, astro), `platforms/` (cloudflare, vercel), and the `design-brief.md` template. The implementer writes to these and the reviewers check against them. They carry no `pack:` marker; the release guard and the marker check cover only `SKILL.md` and agent files.
- `skills/newissue/SKILL.md` — turns a rough idea into a self-contained GitHub issue; orc uses it to file follow-up work.
- `skills/update-orc/SKILL.md` — updates an installed pack to the latest release from any older version, dispatching the `orc-updater` agent.
- `agents/*.md` — one file per subagent (implementer, reviewers, verifier, issue scout, tooling runners, orc-updater). Each has YAML frontmatter: `name`, `pack`, `description`, `model`, optional `tools` and `memory`.
- `CHANGELOG.md` — one section per released version; the release guard publishes the matching section as the release body, and `/update-orc` reads it as the update map.
- `.claude-plugin/plugin.json` — plugin manifest; its `version` is the single source of truth for releases.
- `.claude-plugin/marketplace.json` — marketplace descriptor.
- `.github/workflows/release-guard.yml` — the CI that enforces versioning and formatting (see below).

## No build, lint, or test toolchain

This repo has no `package.json`, no local scripts, and no test suite — it is prompt content. Don't look for a `ready` command or a way to "run" the pack locally. The automated checks are two workflows: `release-guard.yml` runs `npx prettier@3 --write .`, does the version bump/sync, and refuses to release a version with no `CHANGELOG.md` section; `pack-integrity.yml` verifies that every `pack:` marker matches `plugin.json`, that every agent a skill names exists, that every skill and agent frontmatter parses, and that every reference file the orc skill names exists under `skills/orc/references/`. If you want to match what CI will do to your Markdown before pushing, run that same Prettier command; otherwise CI formats it for you on the PR into `main`.

## Versioning is load-bearing — how releases actually ship

Plugin users only receive updates when `.claude-plugin/plugin.json`'s `version` changes. Three coupled facts follow:

1. **Every skill and agent file carries a `pack: orc-pack@x.y.z` marker** in its frontmatter (line 3). The reference files under `skills/orc/references/` carry none; install and update docs treat them as pack-owned because they sit in the pack's skill directory. These must all match `plugin.json`'s version.
2. **You normally don't bump or sync these by hand.** The release-guard workflow, on PRs into `main` (and direct pushes to `main`), detects any change under `skills/` or `agents/` that landed without a version bump, bumps the patch version, rewrites every `pack:` marker to match, runs Prettier, and commits the fixes back onto the branch under review.
3. **Every released version needs a `CHANGELOG.md` section.** The guard extracts the `## [x.y.z]` section and publishes it verbatim as the GitHub release body; with no section, the job fails and nothing is tagged or published. `/update-orc` reads that body, plus every section between the installed and target versions, as the map an updater agent follows — so write each entry for a stranger who may be jumping several releases: what changed, the exact files, any migration, and the paths to read.

Practical consequence: when editing skill or agent content on `dev`, you can leave the version alone and let the guard bump it, **or** bump `plugin.json` yourself for an intentional minor/major release — but if you bump by hand, sync the `pack:` markers in the same commit so they don't drift. Never hand-edit a `pack:` marker to a version that disagrees with `plugin.json`.

## Model assignments are intentional

Each agent pins a `model:` and, where the model supports it, an `effort:` in frontmatter. The split is a deliberate cost/quality tradeoff mirrored in the orc prompt:

- **Haiku** (`haiku` alias) — command runners that relay output and make no judgement calls: `lint`, `typecheck`, `test`, `impact`, `fallow`. Haiku doesn't support `effort`, so these carry no `effort:` line. The alias follows new Haiku releases.
- **Sonnet 5** (`claude-sonnet-5`, `effort: high`) — `test-coverage-reviewer` only. Whether logic is tested is a mechanical, recall-heavy question, and the Opus 5.5 verifier filters its false positives.
- **Opus 5.5** (`claude-opus-5-5`) — every other agent that makes a judgement call, with `effort` as the cost control:
  - `high` — `security-reviewer`, `skill-vetter`, `dependency-vetter`, `orc-updater`: security work, plus jobs that run too rarely for effort to matter to cost.
  - `medium` (Opus 5.5's default) — `implementer`, `verifier`, `design-reviewer`, `quality-reviewer`, `architecture-reviewer`, `ui-reviewer`: the per-task work whose judgement decides code quality and design, which is the pack's top priority. `quality-reviewer` and `architecture-reviewer` moved here from Sonnet 5 in 1.7.0 for that reason.
  - `low` — `next-issue-finder`, `docs-writer`, `comment-reviewer`: triage, prose, and a narrow rubric.
- **Fable 5.1** (`claude-fable-5-1`) — never a frontmatter default. Orc uses it only for the round-three implementer when a blocking finding survives two fix rounds.

Security review and verification stay on Opus 5.5 regardless of cost; only the test-coverage reviewer runs on Sonnet. Sonnet is pinned to the explicit id `claude-sonnet-5` so that moving to Sonnet 5.5 is a decision, not a silent change; Haiku stays on the `haiku` alias because its runners make no judgement calls. Revisit the tiers when Sonnet 5.5 and Haiku 5.5 ship. The effort levels are informed defaults, not measured ones. The cheapest check is to compare verifier-confirmed findings per reviewer and fix rounds per task across real runs.

Claude Code resolves a subagent's model as per-dispatch `model` → frontmatter `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → main model, so the frontmatter is a default and orc can move an agent to another model on a specific dispatch. A dispatch can't change `effort`, so the frontmatter value always applies.

Pin Opus as the explicit id `claude-opus-5-5`, never the bare `opus` alias: Claude Code runs an alias subagent on the session's own model when both are in the same family, so an alias would follow a session running on Opus 5. **Opus 5 (`claude-opus-5`, the 5.0 release) stays banned** for running orc (the skill refuses to start on it); don't reintroduce it as a default anywhere. Opus 5.5 is a different model and is the recommended one.

## Conventions when editing prompts

- **The agents are repo-agnostic by design.** They discover the target repo's stack, commands, and conventions at runtime by reading its `CLAUDE.md`/`AGENTS.md`, manifest, and code. Don't hardcode a stack, command, or path (like `pnpm ready` or a `dev` branch) into an agent — keep it general and let it discover.
- **Stack knowledge lives in the playbooks, not the agents.** Framework- and platform-specific rules go in `skills/orc/references/frameworks/` or `platforms/`, which orc loads only when it detects that stack. Each playbook tells agents to check the installed version and to trust that version's docs over the playbook; keep version-sensitive claims hedged that way. Adding a playbook means adding its detection rule to step 1 of `skills/orc/SKILL.md` and naming it there by its full path (`frameworks/<name>.md`), which is what `pack-integrity.yml` checks.
- **The standards defer to the repo.** Every standards file ranks the repo's own docs and established patterns above itself. Keep that precedence when editing them; the pack is used in client repos whose structure must never be reshaped to the pack's taste.
- **Every agent that reads a standard gets it by path from orc**, with a fallback to `.claude/skills/orc/references/` when run on its own. When you add a standard or change which agent reads it, update the **Standards** table in `skills/orc/SKILL.md`.
- **Frontmatter shape must stay consistent** across files: `name` and `pack` first, then `description`, then `model` and `effort`. The `description` is what triggers the skill/agent, so it carries the trigger phrases — keep it specific.
- The working branch is `dev`; `main` is the release branch that the guard and plugin consumers track. Open PRs from `dev` into `main`.
