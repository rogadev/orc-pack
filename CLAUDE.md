# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`orc-pack` is a **source pack** you integrate into your larger projects — it distributes `/orc` (an autonomous, subagent-driven development orchestrator) plus the team of subagents it dispatches. It reaches a project one of two ways: installed as a Claude Code plugin (this repo is also its own plugin marketplace), or copied into that project's `.claude/`. Either way the pack runs _inside those projects_, never in place here. There is no application code in this repo: every deliverable is a Markdown prompt (`skills/*/SKILL.md` and `agents/*.md`) that ships elsewhere. "Editing the product" means editing prompt text, not code.

Read `README.md` for the user-facing behavior of `/orc` and `INSTALL.md` (written for an AI agent) for how the pack gets copied into a target repo.

## Layout

- `skills/orc/SKILL.md` — the orchestrator prompt. The core deliverable.
- `skills/newissue/SKILL.md` — turns a rough idea into a self-contained GitHub issue; orc uses it to file follow-up work.
- `skills/update-orc/SKILL.md` — updates an installed pack to the latest release from any older version, dispatching the `orc-updater` agent.
- `agents/*.md` — one file per subagent (implementer, reviewers, verifier, issue scout, tooling runners, orc-updater). Each has YAML frontmatter: `name`, `pack`, `description`, `model`, optional `tools` and `memory`.
- `CHANGELOG.md` — one section per released version; the release guard publishes the matching section as the release body, and `/update-orc` reads it as the update map.
- `.claude-plugin/plugin.json` — plugin manifest; its `version` is the single source of truth for releases.
- `.claude-plugin/marketplace.json` — marketplace descriptor.
- `.github/workflows/release-guard.yml` — the CI that enforces versioning and formatting (see below).

## No build, lint, or test toolchain

This repo has no `package.json`, no local scripts, and no test suite — it is prompt content. Don't look for a `ready` command or a way to "run" the pack locally. The automated checks are two workflows: `release-guard.yml` runs `npx prettier@3 --write .`, does the version bump/sync, and refuses to release a version with no `CHANGELOG.md` section; `pack-integrity.yml` verifies that every `pack:` marker matches `plugin.json`, that every agent a skill names exists, and that every skill and agent frontmatter parses. If you want to match what CI will do to your Markdown before pushing, run that same Prettier command; otherwise CI formats it for you on the PR into `main`.

## Versioning is load-bearing — how releases actually ship

Plugin users only receive updates when `.claude-plugin/plugin.json`'s `version` changes. Three coupled facts follow:

1. **Every file carries a `pack: orc-pack@x.y.z` marker** in its frontmatter (line 3 of each skill and agent). These must all match `plugin.json`'s version.
2. **You normally don't bump or sync these by hand.** The release-guard workflow, on PRs into `main` (and direct pushes to `main`), detects any change under `skills/` or `agents/` that landed without a version bump, bumps the patch version, rewrites every `pack:` marker to match, runs Prettier, and commits the fixes back onto the branch under review.
3. **Every released version needs a `CHANGELOG.md` section.** The guard extracts the `## [x.y.z]` section and publishes it verbatim as the GitHub release body; with no section, the job fails and nothing is tagged or published. `/update-orc` reads that body, plus every section between the installed and target versions, as the map an updater agent follows — so write each entry for a stranger who may be jumping several releases: what changed, the exact files, any migration, and the paths to read.

Practical consequence: when editing skill or agent content on `dev`, you can leave the version alone and let the guard bump it, **or** bump `plugin.json` yourself for an intentional minor/major release — but if you bump by hand, sync the `pack:` markers in the same commit so they don't drift. Never hand-edit a `pack:` marker to a version that disagrees with `plugin.json`.

## Model assignments are intentional

Each agent pins a `model:` and, where the model supports it, an `effort:` in frontmatter. The split is a deliberate cost/quality tradeoff mirrored in the orc prompt:

- **Haiku** (`haiku` alias) — command runners that relay output and make no judgement calls: `lint`, `typecheck`, `test`, `impact`, `fallow`. Haiku doesn't support `effort`, so these carry no `effort:` line. The alias follows new Haiku releases.
- **Sonnet 5** (`claude-sonnet-5`, `effort: high`) — the routine per-task reviewers: `architecture-reviewer`, `quality-reviewer`, `test-coverage-reviewer`. The Opus 5.5 verifier filters their false positives, so what matters is recall, and `high` protects it.
- **Opus 5.5** (`claude-opus-5-5`) — every other agent that makes a judgement call, with `effort` as the cost control:
  - `high` — `security-reviewer`, `skill-vetter`, `dependency-vetter`, `orc-updater`: security work, plus jobs that run too rarely for effort to matter to cost.
  - `medium` (Opus 5.5's default) — `implementer`, `verifier`: the per-task and per-round work.
  - `low` — `next-issue-finder`, `docs-writer`: triage and prose.
- **Fable 5.1** (`claude-fable-5-1`) — never a frontmatter default. Orc uses it only for the round-three implementer when a blocking finding survives two fix rounds.

Security review and verification stay on Opus 5.5 regardless of cost; only the routine reviewers drop to Sonnet. Sonnet is pinned to the explicit id `claude-sonnet-5` so that moving to Sonnet 5.5 is a decision, not a silent change; Haiku stays on the `haiku` alias because its runners make no judgement calls. Revisit the tiers when Sonnet 5.5 and Haiku 5.5 ship. The effort levels are informed defaults, not measured ones. The cheapest check is to compare verifier-confirmed findings per reviewer and fix rounds per task across real runs.

Claude Code resolves a subagent's model as per-dispatch `model` → frontmatter `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → main model, so the frontmatter is a default and orc can move an agent to another model on a specific dispatch. A dispatch can't change `effort`, so the frontmatter value always applies.

Pin Opus as the explicit id `claude-opus-5-5`, never the bare `opus` alias: Claude Code runs an alias subagent on the session's own model when both are in the same family, so an alias would follow a session running on Opus 5. **Opus 5 (`claude-opus-5`, the 5.0 release) stays banned** for running orc (the skill refuses to start on it); don't reintroduce it as a default anywhere. Opus 5.5 is a different model and is the recommended one.

## Conventions when editing prompts

- **The agents are repo-agnostic by design.** They discover the target repo's stack, commands, and conventions at runtime by reading its `CLAUDE.md`/`AGENTS.md`, manifest, and code. Don't hardcode a stack, command, or path (like `pnpm ready` or a `dev` branch) into an agent — keep it general and let it discover.
- **Frontmatter shape must stay consistent** across files: `name` and `pack` first, then `description`, then `model` and `effort`. The `description` is what triggers the skill/agent, so it carries the trigger phrases — keep it specific.
- The working branch is `dev`; `main` is the release branch that the guard and plugin consumers track. Open PRs from `dev` into `main`.
