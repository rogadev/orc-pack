---
name: deep-review
description: Deep review of a branch or range in <project> (<framework> on <platform>), sized to what changed. Use when the user says "/deep-review", "review my branch", "review dev before the PR", or "is this ready to merge".
argument-hint: "[ref | a..b | working] [quick | full] [auto]"
based-on: orc-review@<version>
---

# Deep review: <project>

This is a project profile for orc-pack's `orc-review` skill. Invoke the `orc-review` skill with `$ARGUMENTS (profile: .claude/skills/deep-review/SKILL.md)` and run its workflow with the profile below. Edit only the profile; the workflow lives in `orc-review` and updates with the pack.

## Stack

- **Framework:** <name and version>, playbook `frameworks/<name>.md`
- **Platform:** <deploy target>, playbook `platforms/<name>.md`, or none
- **Checks:** lint `<command>`, typecheck `<command>`, test `<command>`
- **Run locally:** `<command>` at `<url>`

## Risk map

Each row tells orc-review which surface a path is, and a path may sit in several rows (an auth endpoint is both Trust boundary and Server); the lanes come from orc-review's rules for every surface a changed file touches. **Extra lanes** adds lanes on top of those. A path no row matches is classified by the generic rules. Paths are globs that exist in this repo.

| Surface          | Paths                                                                               | Extra lanes |
| ---------------- | ----------------------------------------------------------------------------------- | ----------- |
| Trust boundary   | <auth module, server hooks or middleware, endpoints, actions, webhooks, env access> |             |
| Server           | <routes, services, jobs>                                                            |             |
| Data             | <schema, migrations, query modules>                                                 |             |
| UI               | <components, pages, styles, tokens, copy>                                           |             |
| Config and infra | <framework config, CI workflows, deploy config>                                     |             |

## Ignore

Paths left out of the diff the reviewers read: <generated types, vendored code, build output that is committed>.

## Architecture

<Three to eight lines: the layers, where each kind of code lives, and the boundaries a change must respect.>

## Intentional non-issues

<Patterns that look wrong to a generic reviewer but are deliberate here, each with its reason. Leave empty rather than guess.>

## Extra focus

<Optional. Checks specific to this app, each with the paths and the lane it applies to, for example: "every `+page.server.ts` load checks `locals.user` (security-reviewer)".>
