# INSTALL — agent instructions for baking the orc pack into a repo

**You are an agent reading this inside a Claude Code session that is already open in a target project** (the user pointed you at this folder and asked you to install it). Your job: copy this kit's skill and agents into the current repo's `.claude/` directory, adapt them to the repo, and verify the result — without breaking anything already there.

Work through the phases in order. Don't skip verification. When you're done, give the user the short summary at the end.

---

## What this pack is

`/orc` is an autonomous orchestrator skill: it picks (or is handed) a unit of work, plans it as a live task list, dispatches implementer and reviewer subagents, loops review↔fix until only nitpicks remain, runs the repo's ready check, commits, and closes out. It depends on a set of subagents — a scout, tooling runners, a panel of code reviewers, and a verifier. **The skill and the agents are one system; install them together** or `/orc` will dispatch agents that don't exist.

Kit layout:

```
orc-pack/
├── INSTALL.md              ← you are here (do NOT copy this into the repo)
├── README.md               ← for humans (do NOT copy this into the repo)
├── skills/
│   ├── orc/
│   │   └── SKILL.md
│   └── newissue/
│       └── SKILL.md
└── agents/
    ├── architecture-reviewer.md
    ├── codegraph.md
    ├── dependency-vetter.md
    ├── docs-writer.md
    ├── fallow.md
    ├── impact.md
    ├── lint.md
    ├── next-issue-finder.md
    ├── quality-reviewer.md
    ├── security-reviewer.md
    ├── skill-vetter.md
    ├── test-coverage-reviewer.md
    ├── test.md
    ├── typecheck.md
    └── verifier.md
```

> `.claude-plugin/codegraph.known-good.json` in the kit records the CodeGraph install policy (install-latest-after-vet), the last human-vetted version to fall back to, and its integrity hash. It's kit config, not a runtime file — you don't copy it into the repo, but Phase 4.5 reads it.

---

## Phase 1 — Decide the destination (project vs global)

Two valid targets. **Default to project scope** unless the user says otherwise.

| Scope                 | Destination root                                    | Use when                                                                                                                                                            |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project** (default) | `<repo>/.claude/`                                   | The pack should live with this repo and be shared/committed with it (or kept local to it). This is almost always what's wanted when installing "into this project". |
| **Global**            | `~/.claude/` (`C:\Users\<you>\.claude\` on Windows) | The user wants `/orc` available in every project on this machine.                                                                                                   |

Confirm the repo root first — run `git rev-parse --show-toplevel`. Everything below is relative to the destination root you chose.

> Note on committing: some repos intentionally gitignore `.claude/` (keep it local); others commit it to share with the team. Check the repo's `.gitignore` and existing `.claude/` tracking before assuming. Don't change that policy as a side effect of installing — match what the repo already does.

---

## Phase 2 — File mapping (this is the core of the install)

Copy each kit file to the destination below. The directory names — `.claude/skills/<name>/SKILL.md` and `.claude/agents/<name>.md` — are exactly what Claude Code scans, so the paths are not negotiable.

| Kit file                           | → Destination in the repo                         |
| ---------------------------------- | ------------------------------------------------- |
| `skills/orc/SKILL.md`              | `<root>/.claude/skills/orc/SKILL.md`              |
| `skills/newissue/SKILL.md`         | `<root>/.claude/skills/newissue/SKILL.md`         |
| `agents/architecture-reviewer.md`  | `<root>/.claude/agents/architecture-reviewer.md`  |
| `agents/codegraph.md`              | `<root>/.claude/agents/codegraph.md`              |
| `agents/dependency-vetter.md`      | `<root>/.claude/agents/dependency-vetter.md`      |
| `agents/docs-writer.md`            | `<root>/.claude/agents/docs-writer.md`            |
| `agents/fallow.md`                 | `<root>/.claude/agents/fallow.md`                 |
| `agents/impact.md`                 | `<root>/.claude/agents/impact.md`                 |
| `agents/lint.md`                   | `<root>/.claude/agents/lint.md`                   |
| `agents/next-issue-finder.md`      | `<root>/.claude/agents/next-issue-finder.md`      |
| `agents/quality-reviewer.md`       | `<root>/.claude/agents/quality-reviewer.md`       |
| `agents/security-reviewer.md`      | `<root>/.claude/agents/security-reviewer.md`      |
| `agents/skill-vetter.md`           | `<root>/.claude/agents/skill-vetter.md`           |
| `agents/test-coverage-reviewer.md` | `<root>/.claude/agents/test-coverage-reviewer.md` |
| `agents/test.md`                   | `<root>/.claude/agents/test.md`                   |
| `agents/typecheck.md`              | `<root>/.claude/agents/typecheck.md`              |
| `agents/verifier.md`               | `<root>/.claude/agents/verifier.md`               |

**Do NOT copy `INSTALL.md` or `README.md` into the repo** — they're kit docs, not runtime files.

Every kit file carries `pack: orc-pack@<version>` in its frontmatter. Leave it in place when copying — it's how a future install recognizes a file as the pack's rather than the repo's own (Phase 3). After copying, write `<root>/.claude/orc-pack.provenance.md` recording the pack version, the install date, the source path, and any files you overwrote or renamed.

Create `<root>/.claude/skills/orc/` and `<root>/.claude/agents/` if they don't exist, then copy. On Windows the destination is typically `<repo>\.claude\...`; use the path style the session is running in.

---

## Phase 3 — Handle conflicts (check BEFORE copying)

**Whole-system check first.** Before comparing individual files, look at what already lives in `.claude/`. If the repo has its own orchestration system — an orchestrator skill, an agent team, or agents doing the pack's jobs under different names (its own code reviewer, issue picker, implementer) — the decision is system-level, not per-file. Stop and ask the user **once**, offering: keep the repo's system and install nothing; install only the pack pieces with no counterpart in the repo (complements only); replace the repo's system with the pack; or install under suffixed names side by side (last resort — two orchestrators answering near-identical invocations). Don't ask file by file when the real conflict is between two systems.

Then, for every destination path, check whether a file already exists. **Never blind-overwrite.**

- **No file there** → copy it in. Done.
- **A file with the same name exists** → check its frontmatter for a `pack:` marker.
  - **`pack: orc-pack@<version>` present** → an earlier install of this pack. Overwrite with the kit version, then re-apply any repo-specific edits made since (the repo's git history for that file shows them).
  - **No `pack:` marker** → the repo's own artifact. Do **not** clobber it. If it's richer or repo-tuned than the kit's, prefer the repo's and note it — the kit's agents are deliberately generic starting points. Otherwise ask the user: keep the repo's, take the kit's, or install the kit's under a suffixed name (for example `security-reviewer-orc`) with the orc skill's references updated — a last resort, because it desyncs the skill's agent names.
- **A skill is its whole directory, not just `SKILL.md`.** When replacing one, decide the fate of every file in the destination directory: remove support files the new version doesn't reference — they're orphans — and say so in the report.

**After any replacement, sweep for what it leaves behind.** Grep the repo for references to the replaced system: `CLAUDE.md`, `.claude/README.md`, ADRs or docs describing the old workflow, skills that chained into it, agents only the old system dispatched. Propose updates to the user (in repos with an ADR convention, a superseding ADR rather than an edit). A replaced orchestrator whose docs still describe it misleads every future session.

The `skill-vetter` agent in this pack is exactly the tool for a cautious install — if the user is wary of dropping in unfamiliar agent files, run it over this kit's `agents/` folder first and report its verdicts before copying.

---

## Phase 4 — Adapt to the repo

The kit's agents and skill are written to be **project-agnostic**: they discover the repo's stack, commands, and conventions at runtime by reading `CLAUDE.md`/`AGENTS.md`, the manifest, and neighbouring code. So a bare copy already works. But a few quick adaptations make them sharper — do these when the information is readily available:

1. **Confirm the ready command and working branch.** The orc skill runs "the repo's aggregate check" and commits to "the integration branch". If the repo's `CLAUDE.md`/`AGENTS.md` already state these (for example `pnpm ready`, branch `dev`), the skill will find them — no edit needed. If the repo has **no** `CLAUDE.md`/`AGENTS.md` documenting them, consider adding a short note there (not into the skill) so every agent benefits. Ask the user before creating or editing repo docs.
2. **Prune what the repo can't use.** `fallow` only applies to JavaScript/TypeScript repos and needs the `fallow` CLI — it self-skips when absent, so it's safe to leave, but you may drop `agents/fallow.md` in a non-JS repo. `impact` is optional metrics; keep or drop per the user's preference. `skills/newissue/` is optional but recommended — it's how orc's Discoveries step files follow-up work well; drop it only if the user has their own issue-filing skill (a same-name conflict routes through Phase 3 as usual) or the repo doesn't track work as GitHub issues. It reads per-repo house rules from `.claude/newissue.local.md` or a `## New issue house rules` section in `CLAUDE.md`/`AGENTS.md` — mention that to the user rather than editing the skill.
3. **Leave the reviewers generic unless asked.** They adapt per-repo at runtime. Only hand-tune a reviewer (hardcoding a repo's trust boundary or stack rules) if the user explicitly wants the sharper, repo-specific version — that's a bigger, opt-in step, not part of a basic install.

Don't over-engineer this phase. The pack is designed to work as-copied; adaptation is polish, not a prerequisite.

---

## Phase 4.5 — CodeGraph (optional, gated by a security vet)

CodeGraph is an optional under-the-hood tool: the `codegraph` agent shells out to the CodeGraph CLI to give orc real impact-radius, callers, callees, and affected tests instead of inferred structure. It's polyglot (20+ languages), so it complements `fallow` (JS/TS only). The user never interacts with it directly — it's purely internal to orc's subagents, exactly like `fallow`. If the CLI isn't installed, the `codegraph` agent self-skips; installing it is opt-in.

**Do not enable CodeGraph without vetting first.** The policy is **install-latest-after-vet**: get the newest version so users get current fixes, but only after it passes the security vet. A package can change upstream at any time, so the vet is the gate — not a one-time pin.

1. **Ask the user if they want CodeGraph.** If they decline, leave `agents/codegraph.md` copied but inert (it self-skips with no CLI) and move on. Nothing else in the pack depends on it.
2. **Resolve and vet the latest version.** Read `.claude-plugin/codegraph.known-good.json` for the `package` name and the `knownGoodVersion` fallback. Resolve latest (`npm view <package> version`), then dispatch the `dependency-vetter` agent against that exact resolved version. It inspects the version without executing it and returns PASS / NEEDS-REVIEW / REJECT.
   - **PASS** → install that version (step 3).
   - **NEEDS-REVIEW or REJECT** → do NOT install it. Fall back: dispatch `dependency-vetter` against `knownGoodVersion`; if that PASSes, install the fallback instead and note that latest was held back. If neither passes, leave the `codegraph` agent inert, report the verdict, and finish the rest of the install normally. A skipped CodeGraph is a safe outcome — it's optional.
3. **Install the vetted version** (the resolved latest, or the fallback). Use the exact version the vet passed, never a bare floating tag:

   ```bash
   npm install -g @colbymchenry/codegraph@<vetted-version>
   # or run on demand: npx --yes @colbymchenry/codegraph@<vetted-version> <cmd>
   ```

4. **Two setup notes for the user** (both are about keeping it invisible and safe):
   - Turn off telemetry — it's on by default: `codegraph telemetry off`.
   - Do NOT run `codegraph upgrade` or `codegraph install`. `upgrade` moves off the vetted version (updates should go through the vet at update time, not around it); `install` registers a persistent MCP server into your agent config, which orc does not use and does not need. (If you personally want the MCP server for interactive coding sessions, that's a separate opt-in — see the pack's `README.md` — and you should vet the version the same way first.)
5. **Record it.** Add the installed CodeGraph version, its integrity hash, and the `dependency-vetter` verdict to `<root>/.claude/orc-pack.provenance.md` — a dated record of exactly what was vetted and installed, so a future update (see `UPDATE.md`) knows the baseline and can re-vet the new latest against it.

---

## Phase 5 — Verify

1. **Files are in place.** List `<root>/.claude/skills/` and `<root>/.claude/agents/` and confirm the skills (`orc`, plus `newissue` unless pruned) and up-to-15 agent files are present.
2. **Frontmatter parses.** Each agent `.md` and the `SKILL.md` must start with a valid YAML frontmatter block (`---` … `---`) with at least `name` and `description`. A malformed frontmatter block makes Claude Code silently skip the file.
3. **Agent names match references.** The orc skill dispatches agents by name (`next-issue-finder`, `security-reviewer`, `architecture-reviewer`, `quality-reviewer`, `test-coverage-reviewer`, `verifier`, and the tooling runners). If Phase 3 forced you to rename any agent, update the matching reference inside `skills/orc/SKILL.md` so the skill dispatches a name that exists.
4. **Discoverability.** Skills and agents are picked up when a session starts. Tell the user that `/orc` and the new agents become available in a **new** Claude Code session (or after reloading), not necessarily mid-session in the one running the install.
5. **Provenance.** `<root>/.claude/orc-pack.provenance.md` exists and names the installed pack version (Phase 2).

---

## Phase 6 — Report to the user

Give them a short, human summary:

- Where you installed (project or global, and the path).
- The count: 1 `orc` skill + N agents.
- Any conflicts you hit and how you resolved them (especially anything you renamed or skipped).
- CodeGraph's status (Phase 4.5): enabled with the vetted version, declined, or skipped because the vet didn't PASS — and the `dependency-vetter` verdict if you ran it.
- The one setup step the pack can't do for them: **enabling the Task/to-do tool**, which recent Claude Code turns off by default on Opus 4.8 and Sonnet 5 — the models this pack runs on. Point them at the pack's `README.md` → "Turn on the to-do list" and give them the one-liner: set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` in the environment before launching Claude Code (details and alternatives in the README).
- The model recommendation: **run `/orc` on Opus 4.8 or Sonnet 5, and do not use Opus 5** — the pack is calibrated to the former and Opus 5 drives it poorly. (The skill won't dispatch subagents on Opus 5, but the session model is the user's to set.)
- That `/orc` is available in a new session.

Do **not** run `/orc` yourself to "test" it unless the user asks — it's an autonomous run that commits code. Installation is done when the files are in place and verified.
