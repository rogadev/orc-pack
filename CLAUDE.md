# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`orc-pack` is a **source pack** you integrate into your larger projects — it distributes `/orc` (an autonomous, subagent-driven development orchestrator) plus the team of subagents it dispatches. It reaches a project one of two ways: installed as a Claude Code plugin (this repo is also its own plugin marketplace), or copied into that project's `.claude/`. Either way the pack runs _inside those projects_, never in place here. There is no application code in this repo: every deliverable is a Markdown prompt (`skills/*/SKILL.md` and `agents/*.md`) that ships elsewhere. "Editing the product" means editing prompt text, not code.

Read `README.md` for the user-facing behavior of `/orc` and `INSTALL.md` (written for an AI agent) for how the pack gets copied into a target repo.

## Layout

- `skills/orc/SKILL.md` — the orchestrator prompt. The core deliverable.
- `skills/newissue/SKILL.md` — turns a rough idea into a self-contained GitHub issue; orc uses it to file follow-up work.
- `agents/*.md` — one file per subagent (reviewers, verifier, issue scout, tooling runners). Each has YAML frontmatter: `name`, `pack`, `description`, `model`, optional `tools` and `memory`.
- `.claude-plugin/plugin.json` — plugin manifest; its `version` is the single source of truth for releases.
- `.claude-plugin/marketplace.json` — marketplace descriptor.
- `.github/workflows/release-guard.yml` — the CI that enforces versioning and formatting (see below).

## No build, lint, or test toolchain

This repo has no `package.json`, no local scripts, and no test suite — it is prompt content. Don't look for a `ready` command or a way to "run" the pack locally. The only automated check is the release-guard workflow, which runs `npx prettier@3 --write .` in CI. If you want to match what CI will do to your Markdown before pushing, run that same Prettier command; otherwise CI formats it for you on the PR into `main`.

## Versioning is load-bearing — how releases actually ship

Plugin users only receive updates when `.claude-plugin/plugin.json`'s `version` changes. Two coupled facts follow:

1. **Every file carries a `pack: orc-pack@x.y.z` marker** in its frontmatter (line 3 of each skill and agent). These must all match `plugin.json`'s version.
2. **You normally don't bump or sync these by hand.** The release-guard workflow, on PRs into `main` (and direct pushes to `main`), detects any change under `skills/` or `agents/` that landed without a version bump, bumps the patch version, rewrites every `pack:` marker to match, runs Prettier, and commits the fixes back onto the branch under review.

Practical consequence: when editing skill or agent content on `dev`, you can leave the version alone and let the guard bump it, **or** bump `plugin.json` yourself for an intentional minor/major release — but if you bump by hand, sync the `pack:` markers in the same commit so they don't drift. Never hand-edit a `pack:` marker to a version that disagrees with `plugin.json`.

## Model assignments are intentional

Each agent pins a `model:` in frontmatter, and the split is a deliberate cost/quality tradeoff mirrored in the orc prompt:

- **Haiku** — lightweight scan-and-report agents: `lint`, `typecheck`, `test`, `impact`, `fallow`, `codegraph`, `next-issue-finder`, `docs-writer`.
- **Sonnet** — judgment-heavy agents: the reviewers (`security-reviewer`, `architecture-reviewer`, `quality-reviewer`, `test-coverage-reviewer`), `verifier`, `skill-vetter`, `dependency-vetter`.

When adding or editing an agent, place it on the right tier. **Opus 5 is explicitly banned** for running orc (the skill refuses to dispatch on it) — see the README and the SKILL.md preflight for the rationale; don't reintroduce it as a default anywhere.

## Conventions when editing prompts

- **The agents are repo-agnostic by design.** They discover the target repo's stack, commands, and conventions at runtime by reading its `CLAUDE.md`/`AGENTS.md`, manifest, and code. Don't hardcode a stack, command, or path (like `pnpm ready` or a `dev` branch) into an agent — keep it general and let it discover.
- **Frontmatter shape must stay consistent** across files: `name` and `pack` first, then `description`, then `model`. The `description` is what triggers the skill/agent, so it carries the trigger phrases — keep it specific.
- The working branch is `dev`; `main` is the release branch that the guard and plugin consumers track. Open PRs from `dev` into `main`.
