# INSTALL — agent instructions for baking the orc pack into a repo

**You are an agent reading this inside a Claude Code session that is already open in a target project** (the user pointed you at this folder, or at its GitHub URL, and asked you to install it). Your job: copy this kit's skills and agents into **that** repo's `.claude/` directory (the repo the session is open in, never the kit's own checkout), adapt them to the repo, and verify the result — without breaking anything already there.

Work through the phases in order. Don't skip verification. When you're done, give the user the short summary at the end.

---

## What this pack is

`/orc` is a skill that works GitHub issues end to end in the main session, one at a time: it reads each issue, plans it, pins the behavior in tests, builds it, screenshots UI changes, updates the docs, and commits one commit per issue, then pushes and closes the issues when the user says so. It dispatches no builder or reviewer agents. `/do` is the same skill under another name. Review happens afterward, when the user runs `/orc-review` (or the project's `/deep-review`), which dispatches the pack's reviewer lanes, gate runners, and verifier. **Install the skills and agents together**, or `/orc-review` will dispatch agents that don't exist.

Kit layout:

```
orc-pack/
├── INSTALL.md              ← you are here (kit docs and repo files: do NOT copy any of these)
├── UPDATE.md, README.md, CHANGELOG.md, CLAUDE.md, LICENSE
├── docs/, .claude/, .claude-plugin/, .github/
├── skills/
│   ├── orc/
│   │   ├── SKILL.md
│   │   └── references/     ← the standards and playbooks /orc-review's lanes check against, and the release check
│   │       ├── update-check.md
│   │       ├── standards/  (code, comments, structure, ui, data)
│   │       ├── frameworks/ (next, nuxt, sveltekit, astro)
│   │       └── platforms/  (cloudflare, vercel)
│   ├── do/
│   │   └── SKILL.md        ← /do, which reads and follows ../orc/SKILL.md
│   ├── orc-review/
│   │   ├── SKILL.md
│   │   └── references/     ← profile-template.md (the project profile /orc-review setup fills in), lane-template.md (the repo-lane contract), and template-changes.md (the review template's version and its changes)
│   ├── newissue/
│   │   └── SKILL.md
│   ├── retro/
│   │   ├── SKILL.md
│   │   └── references/     ← usage.mjs, the transcript usage summary
│   ├── shipcheck/
│   │   ├── SKILL.md
│   │   └── references/     ← smoke-runner.mjs, the Playwright smoke template
│   ├── tiedown/
│   │   └── SKILL.md
│   └── update-orc/
│       ├── SKILL.md
│       └── references/     ← check-install.mjs, the install check every install, update, and setup ends with
└── agents/
    ├── architecture-reviewer.md
    ├── comment-reviewer.md
    ├── dependency-vetter.md
    ├── fallow.md
    ├── lint.md
    ├── orc-updater.md
    ├── quality-reviewer.md
    ├── security-reviewer.md
    ├── setup-auditor.md
    ├── skill-vetter.md
    ├── test-coverage-reviewer.md
    ├── test.md
    ├── typecheck.md
    ├── ui-reviewer.md
    ├── usages.md
    └── verifier.md
```

---

## Phase 0 — Lock the target before you touch anything

Two folders are in play and they must never be confused:

- The **target** is the repo the Claude Code session is open in. Resolve it once, from the session's working directory, with `git rev-parse --show-toplevel`, and write that path down. Everything installs under `<target>/.claude/`.
- The **kit** is this folder — the source you copy _from_. It is never the destination.

How you got here decides where the kit lives:

- **The user gave a URL** (`https://github.com/<owner>/orc-pack`, "install this"): clone the kit into the session scratchpad, never into the target — `gh repo clone <owner>/orc-pack "<scratchpad>/orc-pack" -- --depth 1` — then read the clone's `INSTALL.md` and continue from Phase 1. Do **not** go looking for an existing `orc-pack` checkout on the machine. A local `orc-pack` folder is the pack's source repo or someone's clone; it is neither the install target nor the copy to install from.
- **The user gave a local folder** (`~/orc-pack`): that folder is the kit. Do not `cd` into it and resolve the repo root from there — the root check above runs in the target.

**Hard stop:** if the target root contains `.claude-plugin/plugin.json` with `"name": "orc-pack"`, the session is open in the kit's own source repo. Do not install. Say so and ask the user which project they meant.

---

## Phase 1 — Scope: the repo holds the whole pack and what's unique to it

**Install the whole pack at project scope**, into `<target>/.claude/`, the **target** you resolved in Phase 0. Install into `~/.claude/` (`C:\Users\<you>\.claude\` on Windows) only when the user asks for a global install by name. Everything below is relative to the destination root.

A repo carries two kinds of file, and both live in it, so everyone who clones the repo gets the same workflow:

- **The pack's files:** every skill and agent in the kit, identical in every repo. They are the workflow; a project never edits them to fit itself.
- **The project's own files:** its review profile, the profile's references, and its repo lanes (`.claude/skills/deep-review/`, written by `/orc-review setup`), its facts in `CLAUDE.md`, `AGENTS.md`, and `.claude/rules/`, and any skill or agent under a name the pack doesn't use. This is where the project's framework, packages, paths, and conventions go.

A global install gives the pack to repos that don't have one. It never stands in for a project install, and it is never a reason to skip a project file. Claude Code resolves same-name files differently by kind: a skill in `~/.claude/skills/` runs instead of the project's skill of that name, and an agent in the project's `.claude/agents/` runs instead of the personal one. So a repo's reviews run its own committed agents, and a stale or hand-made personal skill (for example an old `do`) shadows the project's for that one user. Phase 5's check lists those shadows; report them, and install the project's file regardless.

**Note on committing:** some repos intentionally gitignore `.claude/` (keep it local); others commit it to share with the team. Check the repo's `.gitignore` and existing `.claude/` tracking before assuming. Don't change that policy as a side effect of installing — match what the repo already does.

---

## Phase 2 — File mapping (this is the core of the install)

Copy each kit file to the destination below. The directory names — `.claude/skills/<name>/SKILL.md` and `.claude/agents/<name>.md` — are exactly what Claude Code scans, so the paths are not negotiable.

| Kit file                              | → Destination in the repo                            |
| ------------------------------------- | ---------------------------------------------------- |
| `skills/orc/SKILL.md`                 | `<root>/.claude/skills/orc/SKILL.md`                 |
| `skills/orc/references/` (all)        | `<root>/.claude/skills/orc/references/` (all)        |
| `skills/do/SKILL.md`                  | `<root>/.claude/skills/do/SKILL.md`                  |
| `skills/retro/SKILL.md`               | `<root>/.claude/skills/retro/SKILL.md`               |
| `skills/retro/references/` (all)      | `<root>/.claude/skills/retro/references/` (all)      |
| `skills/orc-review/SKILL.md`          | `<root>/.claude/skills/orc-review/SKILL.md`          |
| `skills/orc-review/references/` (all) | `<root>/.claude/skills/orc-review/references/` (all) |
| `skills/newissue/SKILL.md`            | `<root>/.claude/skills/newissue/SKILL.md`            |
| `skills/shipcheck/SKILL.md`           | `<root>/.claude/skills/shipcheck/SKILL.md`           |
| `skills/shipcheck/references/` (all)  | `<root>/.claude/skills/shipcheck/references/` (all)  |
| `skills/tiedown/SKILL.md`             | `<root>/.claude/skills/tiedown/SKILL.md`             |
| `skills/update-orc/SKILL.md`          | `<root>/.claude/skills/update-orc/SKILL.md`          |
| `skills/update-orc/references/` (all) | `<root>/.claude/skills/update-orc/references/` (all) |
| `agents/<name>.md` (every file)       | `<root>/.claude/agents/<name>.md` (same name)        |

**Copy nothing else.** `INSTALL.md`, `UPDATE.md`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `LICENSE`, `docs/`, `.claude-plugin/`, and `.github/` are kit docs and kit CI, not runtime files. The kit's own `.claude/` holds this repo's `required-secrets.md` and `smoke-checklist.md`, which are repo-owned: never copy them over the target's. It also holds `skills/condense/`, a maintainer skill for this repo only: never copy it. `/update-orc` reads `CHANGELOG.md` from the fetched kit, not from the install.

**Copy `skills/orc/references/` as a whole directory, keeping its subfolders.** `/orc-review` finds the standards and playbooks at `skills/orc/references/` and hands them to its lanes by path; without them the lanes fall back to their generic rubrics and the pack's standards are lost. `/orc` and `/orc-review` also read `update-check.md` there. Keep `skills/orc/` and `skills/do/` side by side under the same `skills/` directory, because `/do` reads `../orc/SKILL.md`.

Every kit skill and agent file carries `pack: orc-pack@<version>` in its frontmatter (the reference files do not; they belong to the pack-owned `skills/orc/` directory). Leave it in place when copying — it's how a future install recognizes a file as the pack's rather than the repo's own (Phase 3). After copying, write `<root>/.claude/orc-pack.provenance.md` recording the pack version, the source repo (`owner/repo`) and URL, the install date, `Scope: project` (or `global`), a `Declined:` line naming each skill or agent the user declined (Phase 4), and any files you overwrote, replaced, or renamed. Recording the source repo is what lets `/update-orc` find future releases later.

Create `<root>/.claude/skills/orc/` and `<root>/.claude/agents/` if they don't exist, then copy. On Windows the destination is typically `<repo>\.claude\...`; use the path style the session is running in.

---

## Phase 3 — Handle conflicts (check BEFORE copying)

**The rule: a pack name holds the pack's file, and the project's knowledge moves to the project's files.** The pack's skills dispatch its agents by name and depend on their brief and report contract, so a repo's own file at a pack name breaks the workflow, often in silence. Project-specific depth is welcome, but it lives under the project's own names (Phase 1), never in place of a pack file. Never keep a repo's file at a pack name because it looks richer or more tuned: that is the most common way an install ends up partial.

**Whole-system check first.** Look at what already lives in `.claude/`. When the repo has its own issue workflow or review pipeline under other names (for example `/go`, `/next`, `/auto`, `/ship`, or an agent team), install the whole pack anyway: it never conflicts with files under other names. Then ask the user **once** whether to retire the repo's workflow, and recommend retiring it: list each of its skills and agents, what in the pack covers it, and which project facts it holds that move to `CLAUDE.md` or the profile. Deleting repo-owned files needs the user's yes; installing the pack never does. Never choose on your own to install nothing, only complements, or suffixed copies. A repo's own `.claude/skills/deep-review/` is not a competing system: it is the project reviewer `orc-review` works with. Leave it in place, and tell the user that `/orc-review setup` converts it into a profile.

Then, for every destination path, check whether a file already exists. **Never blind-overwrite.**

- **No file there** → copy it in. Done.
- **`pack: orc-pack@<version>` present** → an earlier install of this pack. Overwrite with the kit version, then re-apply any repo-specific edits made since (the repo's git history for that file shows them), and record each such file in provenance so Phase 5 passes it with `--allow`.
- **No `pack:` marker, under the `references/` directory of a pack skill (`orc`, `orc-review`, `retro`, `shipcheck`, or `update-orc`)** → pack-owned. The reference files carry no marker but belong to the pack whenever the skill's own `SKILL.md` carries one: overwrite them from the kit, re-apply any repo-local edits the repo's git history shows, and remove any the kit no longer ships. Never treat them as repo-owned.
- **No `pack:` marker at any other pack name** (a skill such as `do` or `tiedown`, or an agent such as `security-reviewer` or `verifier`) → the repo's own version of a pack file. Back it up where a reboot won't clear it: git history is enough for a committed file; otherwise copy it to `~/.claude/orc-pack-backups/<repo name>/<yyyy-mm-dd>/<its path>`. Read it for what is specific to this project (paths, stack and package rules, the trust boundary, conventions, known non-issues), install the kit's file, and put those facts where project knowledge lives: an old reviewer's facts go into the review profile (`/orc-review setup` converts them; tell the user to run it), a specialist check becomes a repo lane under its own name, and anything else goes into `CLAUDE.md` after asking. Report each replacement and where its facts went. A personal skill of the same name in `~/.claude/skills/` is not a repo file and never a conflict.
- **A skill is its whole directory, not just `SKILL.md`.** When replacing one, decide the fate of every file in the destination directory: remove support files the new version doesn't reference — they're orphans — and say so in the report.

**After any replacement, sweep for what it leaves behind.** Grep the repo for references to the replaced system: `CLAUDE.md`, `.claude/README.md`, ADRs or docs describing the old workflow, skills that chained into it, agents only the old system dispatched. Propose updates to the user (in repos with an ADR convention, a superseding ADR rather than an edit). A replaced orchestrator whose docs still describe it misleads every future session.

The `skill-vetter` agent in this pack is exactly the tool for a cautious install — if the user is wary of dropping in unfamiliar agent files, run it over this kit's `agents/` folder first and report its verdicts before copying.

---

## Phase 4 — Adapt to the repo

The kit's agents and skill are written to be **project-agnostic**: they discover the repo's stack, commands, and conventions at runtime by reading `CLAUDE.md`/`AGENTS.md`, the manifest, and neighbouring code. So a bare copy already works. But a few quick adaptations make them sharper — do these when the information is readily available:

1. **Confirm the ready command and working branch.** `/orc` runs "the repo's ready check" and commits to "the integration branch". If the repo's `CLAUDE.md`/`AGENTS.md` already state these (for example `pnpm ready`, branch `dev`), the skill will find them, so no edit is needed. If the repo has **no** `CLAUDE.md`/`AGENTS.md` documenting them, consider adding a short note there (not into the skill) so every session benefits. Ask the user before creating or editing repo docs.
2. **Install every skill and agent; prune nothing on your own.** The user relies on the whole pack, and a skill that "adds nothing" in your judgment is one they use. Leave a piece out only when the user declines it by name, record it on provenance's `Declined:` line, and pass it to Phase 5's check with `--declined`. A name clash with a personal skill in `~/.claude/` is never a reason to leave one out (Phase 1). Notes for the report:
   - `skills/orc/` and its whole `references/` directory are what `/orc-review` reads the standards from, and `/do` reads orc's `SKILL.md`.
   - `agents/fallow.md` stays even on a non-JS/TS repo: it self-skips. Phase 4.5 installs the CLI.
   - `skills/newissue/` reads house rules from `.claude/newissue.local.md` or a `## New issue house rules` section in `CLAUDE.md`/`AGENTS.md`; don't edit the skill.
   - `/orc-review setup` drafts the repo's own `.claude/skills/deep-review/SKILL.md` profile (its stack, risk map, architecture, and known non-issues), so don't create that file during the install.
   - `skills/retro/references/usage.mjs` needs Node to measure tokens.
   - `skills/shipcheck/` drafts `.claude/required-secrets.md` and `.claude/smoke-checklist.md` from the code on first use, so don't create them during the install.
3. **Never tune a pack file to the repo.** The reviewers and standards adapt at runtime, and every standards file already defers to the repo's own docs and patterns. The framework and platform playbooks load only when `/orc-review` detects that stack, so keep them all even if the repo uses one. A repo's trust boundary, stack rules, and packages go into its review profile, and its specialist checks into repo lanes; `/orc-review setup` writes both. That keeps every pack file identical to the kit, so updates stay clean.

Don't over-engineer this phase. The pack is designed to work as-copied; adaptation is polish, not a prerequisite.

---

## Phase 4.5 — Fallow (installed by default, gated by a security vet)

Fallow is a standard under-the-hood tool, not an opt-in. The `fallow` agent shells out to its CLI to give `/orc-review` (and `/orc`, after a run that removed or moved code) dead-code, duplication, complexity, and circular-dependency signals instead of inferred structure, and it self-skips on a non-JS/TS project. The user never interacts with it directly. Install it by default; skip it only if the user explicitly declines.

**Do not install it without vetting first.** The policy is **install-latest-after-vet**: get the newest version so users get current fixes, but only after it passes the security vet. A package can change upstream at any time, so the vet is the gate — not a one-time pin.

1. **Fallow.** Resolve latest (`npm view fallow version`) and dispatch the `dependency-vetter` agent against that exact version. It inspects the version without executing it and returns PASS / NEEDS-REVIEW / REJECT.
   - **PASS** → install it vetted: `npm install -g fallow@<vetted-version>`, or, on a JS/TS project, the repo's own package manager as a **dev dependency** pinned to `<vetted-version>`.
   - **NEEDS-REVIEW or REJECT** → do not install it; leave `agents/fallow.md` inert (it self-skips) and report the verdict.
2. **Record it.** Add the installed fallow version, its integrity hash, and the `dependency-vetter` verdict to `<root>/.claude/orc-pack.provenance.md` — a dated record of exactly what was vetted and installed, so a future update (see `UPDATE.md`) knows the baseline and can re-vet the new latest against it.

---

## Phase 4.6 — Keep the repo's formatters off the pack's files

A repo formatter that rewrites a pack file changes it from the kit's, so the next update sees a local edit that isn't one, and a rewrite can break the Markdown (an escaped `*/` in a standards file, for example). Find what formats Markdown or `.mjs` here: Prettier (`.prettierrc*`, `prettier` in `package.json`), Biome (`biome.json*`), oxfmt (`.oxfmtrc*`), dprint (`dprint.json`), and any `lint-staged` or pre-commit hook that runs one. Add the pack's paths to each one's ignore list (`.prettierignore`, Biome's `files.ignore`, oxfmt's `ignorePatterns`, and so on): every pack skill directory, `.claude/skills/<name>/` for each skill in Phase 2's table, and each pack agent file, `.claude/agents/<name>.md`. Never ignore all of `.claude/`: the project's own files there, the profile and repo lanes included, keep the repo's formatting. When a formatter has no ignore mechanism, say so in the report. This edits repo config for the install's sake, so name each change in the report.

---

## Phase 5 — Verify

1. **Run the install check.** `node <kit>/skills/update-orc/references/check-install.mjs <kit> <root>/.claude`, adding `--allow <path>` for each file Phase 3 re-applied a local edit to and `--declined <path>` for each piece the user declined. It compares every kit file with the install and must print `RESULT: PASS`. On a failure, fix what it lists and run it again; never report the install done while it fails. Then run the repo's own format check (check mode, never write mode) and confirm it lists no pack file, and run the install check once more if it did. Quote its summary line, and any **Shadowed for you** lines, in the report.
2. **Frontmatter parses.** Each agent `.md` and each `SKILL.md` must start with a valid YAML frontmatter block (`---` … `---`) with at least `name` and `description`. A malformed frontmatter block makes Claude Code silently skip the file.
3. **Agent names match references.** Every agent name the installed skills dispatch resolves to a file under `<root>/.claude/agents/`. A pack agent is never renamed (Phase 3), so a name that doesn't resolve means a file is missing.
4. **Discoverability.** Skills and agents are picked up when a session starts. Tell the user that `/orc`, `/do`, `/orc-review`, and the agents become available in a **new** Claude Code session (or after reloading), not necessarily mid-session in the one running the install.
5. **Provenance.** `<root>/.claude/orc-pack.provenance.md` exists and names the installed pack version (Phase 2).

---

## Phase 6 — Report to the user

Give them a short, human summary:

- Where you installed (project or global, and the path).
- The install check's summary line (Phase 5), and anything the user declined.
- Each repo file replaced at a pack name, and where its project facts went (Phase 3); the repo workflow you recommended retiring and the user's answer; and each formatter ignore you added (Phase 4.6).
- Each **Shadowed for you** line from the check: a personal skill in `~/.claude/skills/` that runs instead of the project's for this user, with the fix (update or remove the personal copy).
- Fallow status (Phase 4.5): installed at the vetted version, declined, or held back because the vet didn't PASS — and the `dependency-vetter` verdict if you ran it.
- The one setup step the pack can't do for them: **enabling the Task/to-do tool**, which recent Claude Code turns off by default on newer models, such as Opus 4.8 and Sonnet 5, and likely the ones this pack runs on, such as Opus 5.5. Point them at the pack's `README.md` → "Turn on the to-do list" and give them the one-liner: set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` in the environment before launching Claude Code (details and alternatives in the README).
- The model recommendation: **run `/orc` on Opus 5.5 (`claude-opus-5-5`), and do not use Opus 5 (`claude-opus-5`)**. The skill refuses to start on Opus 5, but the session model is the user's to set.
- How the workflow runs: `/orc` (or `/do`) builds and commits the issues in the session, then the user runs `/orc-review` in a fresh session and `/orc warnings and nits` to fix what it found. Both `/orc` and `/do` are user-invoked only and become available in a new session.
- Whether the repo has a project review profile. With no `<root>/.claude/skills/deep-review/SKILL.md`, tell them to run `/orc-review setup` once in a new session: it drafts the profile that tailors the review to this project's stack and architecture. When that file exists without a `based-on: orc-review@` line, it is a hand-written reviewer: tell them `/orc-review setup` converts it into a profile and keeps its project-specific parts.

Do **not** run `/orc` yourself to "test" it unless the user asks: it commits code, and it is user-invoked only. Installation is done when the install check prints `RESULT: PASS`.
