# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`orc-pack` is a **source pack** you integrate into your larger projects — it distributes `/orc` (an autonomous, subagent-driven development orchestrator) plus the team of subagents it dispatches. It reaches a project one of two ways: installed as a Claude Code plugin (this repo is also its own plugin marketplace), or copied into that project's `.claude/`. Either way the pack runs _inside those projects_, never in place here. There is no application code in this repo: every deliverable is a Markdown prompt (`skills/*/SKILL.md`, `agents/*.md`, and the reference files under `skills/orc/references/`) that ships elsewhere. "Editing the product" means editing prompt text, not code.

Read `README.md` for the user-facing behavior of `/orc` and `INSTALL.md` (written for an AI agent) for how the pack gets copied into a target repo.

## Layout

- `skills/orc/SKILL.md` — the orchestrator prompt. The core deliverable.
- `skills/orc/references/` — the standards orc hands its agents by path: `standards/` (code, comments, structure, ui, data), `frameworks/` (next, nuxt, sveltekit, astro), `platforms/` (cloudflare, vercel), the `design-brief.md` and `work-contract.md` templates, and `builder-contract.md` (the rules every builder shares). The builders write to these and the reviewers check against them. They carry no `pack:` marker; the release guard and the marker check cover only `SKILL.md` and agent files.
- `skills/newissue/SKILL.md` — turns a rough idea into a self-contained GitHub issue; orc uses it to file follow-up work.
- `skills/shipcheck/SKILL.md` — verifies a push through CI, required secrets, the live deploy, and browser smoke checks; optional.
- `skills/orc-loop/SKILL.md` — runs `/orc` over a batch of issues under `/loop`, then reviews the batch as a whole and cleans up its comments once; user-invoked only.
- `skills/orc-loop-iter/SKILL.md` — the `/orc` run `/orc-loop` makes for each issue and fix: it invokes the `orc` skill unchanged and overrides only its review lanes, which the loop's batch review and comment cleanup make up once. Hidden from the `/` menu. Keep orc's workflow in `skills/orc/SKILL.md`; this file holds only the differences.
- `skills/update-orc/SKILL.md` — updates an installed pack to the latest release from any older version, dispatching the `orc-updater` agent.
- `agents/*.md` — one file per subagent (builders, reviewers, verifier, issue scout, tooling runners, orc-updater). Each has YAML frontmatter: `name`, `pack`, `description`, `model`, and optional `tools`, `effort`, and `memory`.
- `CHANGELOG.md` — one section per released version; the release guard publishes the matching section as the release body, and `/update-orc` reads it as the update map.
- `.claude-plugin/plugin.json` — plugin manifest; its `version` is the single source of truth for releases.
- `.claude-plugin/marketplace.json` — marketplace descriptor.
- `.github/workflows/release-guard.yml` and `pack-integrity.yml` — the CI that enforces versioning, formatting, and pack consistency (see below).
- `INSTALL.md` and `UPDATE.md` — written for an AI agent installing or updating the pack in a target repo.
- `docs/` — maintainer notes that never ship, including `model-tiers.md`, the evidence behind the model tiers.
- `.claude/skills/condense/SKILL.md` — `/condense`, a maintainer skill that never ships. Run it after adding or changing skills, agents, or references: it cuts the shipped prompts to the fewest tokens that keep every instruction, and an independent verifier checks that nothing was lost.

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
- **Sonnet 5.5** (`claude-sonnet-5-5`, `effort: high`) — `test-coverage-reviewer` only. Whether logic is tested is a mechanical, recall-heavy question, and the Opus 5.5 verifier filters its false positives.
- **Opus 5.5** (`claude-opus-5-5`) — every other agent that makes a judgement call, with `effort` as the cost control:
  - `high` — `security-reviewer`, `skill-vetter`, `dependency-vetter`, `orc-updater`: security work, plus jobs that run too rarely for effort to matter to cost. Also `data-implementer`, the one builder at high effort: a bad migration or backfill is the hardest mistake in the pack to reverse, so it gets the extra reasoning on every task.
  - `medium` (Opus 5.5's default) — the builders `implementer`, `ui-implementer`, and `api-implementer`, plus `verifier`, `design-reviewer`, `quality-reviewer`, `architecture-reviewer`, `ui-reviewer`: the per-task work whose judgement decides code quality and design, which is the pack's top priority. `quality-reviewer` and `architecture-reviewer` moved here from Sonnet 5 in 1.7.0 for that reason.
  - `low` — `next-issue-finder`, `docs-writer`, `comment-reviewer`, `scope-reviewer`: triage, prose, and a narrow rubric.
- **Fable 5.1** (`claude-fable-5-1`) — never a frontmatter default, because Opus 5.5 matches or beats it on coding for well under half the cost. Orc moves two dispatches to it: `ui-implementer`'s brief and first build on a structural UI task, where Fable's open-ended visual design is stronger, and round three of a fix loop, on whichever builder the task uses, when a Blocker survives two fix rounds. It doesn't review or verify.

Security review and verification stay on Opus 5.5 regardless of cost; by default only the test-coverage reviewer runs on Sonnet. Sonnet is pinned to the explicit id `claude-sonnet-5-5` so that moving to a later Sonnet is a decision, not a silent change; Haiku stays on the `haiku` alias because its runners make no judgement calls. Revisit the tiers when Haiku 5.5 ships. The effort levels are informed defaults, not measured ones. The cheapest check is orc's token ledger (`.git/orc/token-ledger.tsv` in each repo it runs in): compare tokens against verifier-confirmed findings per reviewer, and fix rounds per task, across real runs.

The evidence behind these tiers (the benchmarks, why Sonnet 5.5 holds one lane, why Fable 5.1 has only two jobs, and the design of efficiency mode) is in `docs/model-tiers.md`. Read it before you re-tier anything.

Claude Code resolves a subagent's model as per-dispatch `model` → frontmatter `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → main model, so the frontmatter is a default and orc can move an agent to another model on a specific dispatch. Two limits shape how orc does that:

- **The Agent tool's `model` takes only a family alias** (`opus`, `sonnet`, `haiku`, `fable`), not an exact id. An alias resolves to the session's own model when the session is in that family, and otherwise to that family's current model. So exact ids live in frontmatter, orc leaves `model` off a dispatch whose frontmatter is already right, and it passes an alias only to move an agent: `sonnet` in efficiency mode (a Sonnet 5.5 session) and `fable` for a structural UI task or a round-three fix.
- **A dispatch can't change `effort`**, so the frontmatter value always applies. An agent moved to Sonnet 5.5 runs at its Opus-calibrated `medium` or `low`, where Sonnet 5.5 trails Opus 5.5 at the same level by a wide margin.

**Efficiency mode** (1.9.0) is the one sanctioned exception: on a confirmed Sonnet 5.5 session, orc moves three small dispatches to Sonnet 5.5 and keeps an Opus 5.5 check behind each. `skills/orc/SKILL.md` defines it, and `docs/model-tiers.md` explains its design. Widen it only with evidence from real runs.

Pin Opus in frontmatter as the explicit id `claude-opus-5-5`, never the bare `opus` alias: Claude Code runs an alias subagent on the session's own model when both are in the same family, so an alias would follow a session running on Opus 5. **Opus 5 (`claude-opus-5`, the 5.0 release) stays banned** for running orc (the skill refuses to start on it); don't reintroduce it as a default anywhere. Opus 5.5 is a different model and is the recommended one.

## Conventions when editing prompts

- **The agents are repo-agnostic by design.** They discover the target repo's stack, commands, and conventions at runtime by reading its `CLAUDE.md`/`AGENTS.md`, manifest, and code. Don't hardcode a stack, command, or path (like `pnpm ready` or a `dev` branch) into an agent — keep it general and let it discover.
- **Stack knowledge lives in the playbooks, not the agents.** Framework- and platform-specific rules go in `skills/orc/references/frameworks/` or `platforms/`, which orc loads only when it detects that stack. Each playbook tells agents to check the installed version and to trust that version's docs over the playbook; keep version-sensitive claims hedged that way. Adding a playbook means adding its detection rule to step 1 of `skills/orc/SKILL.md` and naming it there by its full path (`frameworks/<name>.md`), which is what `pack-integrity.yml` checks.
- **The standards defer to the repo.** Every standards file ranks the repo's own docs and established patterns above itself. Keep that precedence when editing them; the pack is used in client repos whose structure must never be reshaped to the pack's taste.
- **Every agent that reads a standard gets it by path from orc**, with a fallback to `.claude/skills/orc/references/` when run on its own. When you add a standard or change which agent reads it, update the **Standards** list in `skills/orc/SKILL.md`.
- **Builders share one contract.** Claude Code agents can't inherit from each other, so every rule all builders follow (the dispatch, untrusted input, brief and build mode, scope, no commits, no suppressions, fix rounds, the report) lives in `skills/orc/references/builder-contract.md`, and each builder's agent file holds only its domain judgement. Put a new shared rule in the contract, never copied into each builder. An agent file may be stricter than the contract, never looser. Security and architecture are deliberately review lanes, not builders.
- **Frontmatter shape must stay consistent** across files: `name` and `pack` first, then `description`, then `model` and `effort` (an agent's `tools` list may sit between `description` and `model`). The `description` is what triggers the skill/agent, so it carries the trigger phrases — keep it specific.
- The working branch is `dev`; `main` is the release branch that the guard and plugin consumers track. Open PRs from `dev` into `main`.
