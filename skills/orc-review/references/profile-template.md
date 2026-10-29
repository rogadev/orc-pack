---
name: deep-review
description: Deep review of a branch or range in <project> (<framework> on <platform>), sized to what changed. Use when the user says "/deep-review", "review my branch", "review dev before the PR", or "is this ready to merge".
argument-hint: "[ref | a..b | #PR | working] [quick | full] [auto]"
based-on: orc-review@<version>
---

# Deep review: <project>

This is a project profile for orc-pack's `orc-review` skill. Invoke the `orc-review` skill with `$ARGUMENTS (profile: .claude/skills/deep-review/SKILL.md)` and run its workflow with the profile below. Edit only the profile; the workflow lives in `orc-review` and updates with the pack. The pack's generic lanes are the base; **Repo lanes** adds this project's specialists only where the base is thin.

## Stack

- **Framework:** <name and installed major version>, playbook `frameworks/<name>.md`
- **Platform:** <deploy target>, playbook `platforms/<name>.md`, or none
- **Run locally:** `<command>` at `<url>`

## Checks

Check-only commands for the gate. **When** is `always`, a path condition, or `remind` (never run; name it under **Needs your attention** when the condition's paths change).

| Check     | Command     | When   |
| --------- | ----------- | ------ |
| lint      | `<command>` | always |
| typecheck | `<command>` | always |
| test      | `<command>` | always |

**Never run:** <commands that rewrite files or data, for example a `ready` script that formats, or a seed that wipes the database>.

## Platform constraints

<Facts from the deploy config and docs that decide server findings: upstream timeouts, replica count (in-memory state is per pod), gateway or session behaviour, body limits, what the app must not break. Write "None known" rather than guess.>

## Risk map

Each row tells orc-review which surface a path is, and a path may sit in several rows (an auth endpoint is both Trust boundary and Server); the lanes come from orc-review's rules for every surface a changed file touches. **Surface** is one of orc-review's nine (Docs, Comments, Tests, UI, Logic, Server, Data, Trust boundary, Config and infra), optionally with a label in parentheses, for example `Server (API contract)`. A labelled row only attaches its repo lanes to those paths and never classifies them, so the generic lanes are unaffected. **Extra lanes** names repo lanes that run on top when a row matches. A path no row matches is classified by the generic rules. Paths are globs that exist in this repo; write `None` in a row that doesn't apply, with the reason.

| Surface          | Paths                                                                               | Extra lanes |
| ---------------- | ----------------------------------------------------------------------------------- | ----------- |
| Trust boundary   | <auth module, server hooks or middleware, endpoints, actions, webhooks, env access> |             |
| Server           | <routes, services, jobs>                                                            |             |
| Data             | <schema, migrations, query modules; or None: no database>                           |             |
| UI               | <components, pages, styles, tokens, copy>                                           |             |
| Config and infra | <framework config, CI workflows, deploy config>                                     |             |

## Repo lanes

<Optional. Leave empty when the generic lanes cover this project. Each lane is an agent in `.claude/agents/` that follows orc-review's repo-lane contract (`orc-review/references/lane-template.md`). **Owns** is what it reviews in depth, so the verifier merges duplicates toward the owner. **Runs when** is a condition on the change, or `always`; a lane with no risk-map row runs on any change outside the docs-only and tests-only shortcuts when its condition holds. **Standards** are the orc standards and playbooks it gets.>

| Lane | Owns | Runs when | Standards |
| ---- | ---- | --------- | --------- |

## Ignore

Paths left out of the diff the reviewers read: <generated types, vendored code, build output that is committed, a committed agent-memory directory>.

## Architecture

<Three to eight lines: the layers, where each kind of code lives, and the boundaries a change must respect. Note here where the installed framework version or the repo's tooling overrides a rule in the playbook or the standards.>

## Intentional non-issues

<Patterns that look wrong to a generic reviewer but are deliberate here, each with its reason. Leave empty rather than guess.>

## Extra focus

<Optional. One block per lane or group of lanes, headed `### <lane>[, <lane>]: <topic>`, with an optional `Paths:` line (globs the block applies to) and an optional `Reference:` line (a file under `.claude/skills/deep-review/references/` the lane reads first). For example:

### security-reviewer: trust model

Reference: `.claude/skills/deep-review/references/security.md`

- Every `+page.server.ts` load checks `locals.user`.>

## After verification

<Optional. A repo agent that runs after the verifier, for example one that rewrites verified findings in plain language with a fix order: the agent, when it runs (for example "at least one Blocker or three Warnings"), and what its answer replaces in the report. Delete the section to skip it.>

## Report destination

<Optional. A gitignored folder the report is copied to, for example `tmp/reviews/`, and a command that records each review, for example a ledger script. Delete the section to keep the report in the scratch folder only.>
