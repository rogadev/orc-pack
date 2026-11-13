# UPDATE — agent instructions for updating the orc pack in a repo

**You are an agent updating an existing orc-pack install** in a target project — refreshing the skills and agents to a newer version of the pack. This is the sibling of `INSTALL.md`: install puts the pack in for the first time; update refreshes what's already there without clobbering the repo's own edits.

If the pack was installed as a Claude Code **plugin** (`/plugin install orc-pack@orc-pack`), you don't update by hand — the plugin receives new versions when `.claude-plugin/plugin.json`'s version moves. This doc is for the **copied-into-`.claude/`** install, where the files live in the repo and you refresh them from a fresh clone of the kit.

For a copied install, the `/update-orc` skill automates this document end to end: it finds the latest release, fetches the kit at that tag, and dispatches the `orc-updater` agent to run these phases, with every changelog entry between the installed and target versions as the map. Read this document when you are updating by hand, doing a custom or partial update, or writing or debugging the updater prompt. An install may be several releases behind, so apply the phases against the **target kit** as an absolute state rather than replaying one release at a time.

Work the phases in order.

---

## Phase 1 — Locate the current install and the new kit

1. Find the installed pack: `.claude/skills/*/SKILL.md` and `.claude/agents/*.md` carrying `pack: orc-pack@<version>` markers, plus the `.claude/skills/orc/references/` directory beside the skill. Read the recorded version from `.claude/orc-pack.provenance.md`. When the project has its own install, update it even if `~/.claude/` holds another: the project's copy is what the repo's collaborators run.
2. **A review-suite install** (provenance `Subset: review`, written by `/orc-review setup`) holds only the review suite that `skills/orc-review/SKILL.md` lists under **Pack files first**. In Phase 2, the kit files are only that suite in the new kit: refresh them, add any the new kit adds to the list, and don't add the rest of the pack.
3. Have the new kit checked out somewhere outside the repo. `/update-orc` fetches it into the session scratchpad at the target tag; by hand, clone it there yourself or use the checkout the user names.
4. Compare versions. If the kit is not newer, there's nothing to do — say so and stop.

---

## Phase 2 — Refresh the pack files

For every kit file (the mapping table in `INSTALL.md` Phase 2 is authoritative):

- **File has a `pack:` marker** → an earlier install of this pack. Overwrite with the kit version, then re-apply any repo-specific edits the repo made since (its git history for that file shows them).
- **File has no `pack:` marker** → the repo's own artifact. Do not clobber it; route through `INSTALL.md` Phase 3 conflict handling. The one exception is the reference directory:
- **Reference files are pack-owned.** Files under the `references/` directory of a pack skill (`.claude/skills/orc/`, `orc-review/`, `retro/`, and `shipcheck/`; an install older than 2.0.0 may also have `orc-rush/`) carry no `pack:` marker, but they belong to the pack whenever that skill's `SKILL.md` carries one, or, for `skills/orc/references/`, whenever provenance says `Subset: review`: overwrite them from the kit, re-apply any repo-local edits the repo's git history shows, and remove any the kit no longer ships. Never route them through conflict handling as repo-owned files.
- **Re-applied edits must still fit the new file.** 2.0.0 rewrote `skills/orc/SKILL.md` from scratch, so an edit made to a 1.x orc skill (to its builder dispatch, review panel, work contract, or efficiency mode) has nothing to apply to. Don't force it in: list it in the report as dropped, and say what in the new skill covers the same need, if anything. If a local edit conflicts with the kit's format, keep the kit's format and note the conflict in the report.
- **A new agent or skill in the kit that isn't in the repo yet** → copy it in, same as a fresh install. Coming from 1.x, that is `skills/do/`.
- **A same-name `do` skill.** When `.claude/skills/do/SKILL.md` already exists without a `pack:` marker, it is the repo's own `/do`. Never overwrite it: route it through `INSTALL.md` Phase 3 conflict handling, and skip the kit's `do` by default, because `/orc` works without it. Say in the report which one the install kept.
- **The project's `.claude/skills/deep-review/SKILL.md` is never refreshed.** It is repo-owned, and the kit ships no file at that path. When it carries a `based-on: orc-review@` line, compare its `template` and `template-reviewed` numbers (inferred from `based-on` when absent, as the target kit's `skills/orc-review/references/template-changes.md` says) with that file's current review template number. Only when the current number is greater than both, say so in the report, naming the newer template versions' summaries, and suggest `/orc-review setup` (which refreshes the profile, keeps the user's entries, and lets them decline any change) or `/orc-review setup skip` (which keeps the profile and stops the reminder). A pack version change alone is never a reason to suggest it.
- **A file the new kit dropped** → remove the stale copy and note it in the report. Remove only files that carry a `pack:` marker, or that sit in a pack skill's `references/` directory; a dropped name the repo reuses for its own file is the repo's.

### From 1.x to 2.0.0

2.0.0 moved `/orc` into the main session and dropped its builders, per-task reviewers, and batch loops. When the installed version is older than 2.0.0, remove these pack files (each skill as its whole directory), and list each one in the report:

- **Skills:** `skills/orc-loop/`, `skills/orc-loop-iter/`, `skills/orc-rush/` (with its `references/briefs.md`), and `skills/orc-rush-iter/`.
- **Agents:** `implementer.md`, `ui-implementer.md`, `api-implementer.md`, `data-implementer.md`, `design-reviewer.md`, `scope-reviewer.md`, `next-issue-finder.md`, `docs-writer.md`, and `impact.md`.
- **References:** `skills/orc/references/builder-contract.md`, `design-brief.md`, `work-contract.md`, and `your-call.md`.

The skills and agents carry `pack:` markers and the references sit in orc's `references/` directory, so all of them are pack-owned: remove them without asking. A file at one of those paths with no `pack:` marker is the repo's own, so leave it and say so. Then add `skills/do/` (see the same-name rule above) and refresh every remaining file.

Also clean up what the dropped workflow left behind, and report each item rather than deleting repo files:

- **State folders.** `<git-dir>/orc-loop/` and `<git-dir>/orc-rush/` hold the old loops' state and saved reports. They are outside the repo's tree; tell the user they can delete them, and that `/retro` no longer reads them.
- **Repo docs.** Grep the repo's `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, and docs for `/orc-loop`, `/orc-rush`, `efficiency mode`, `contract first`, `in a worktree`, and the removed agent names, and propose updates to the user.
- **Agent memory.** `.claude/agent-memory/` folders for the removed agents are notes no agent reads any more. Tell the user; don't delete them.

Project review profiles (`.claude/skills/deep-review/`) need no change: 2.0.0 doesn't change the review template number. Plugin installs get all of this through `/plugin update orc-pack@orc-pack`.

Update `.claude/orc-pack.provenance.md` with the new version, the update date, and anything you overwrote, renamed, or removed.

---

## Phase 3 — Re-vet third-party tools (REQUIRED for fallow)

Fallow follows **install-latest-after-vet**: an update pulls the newest version so the repo gets current fixes, but only after it passes the security vet. **A version is only as trustworthy as its last vet, and a package can be republished or hijacked between releases** — so the vet runs on every update, not just the first install. Fallow is installed by default, so run this phase.

1. **Resolve and re-vet latest** (`npm view fallow version`) before adopting it:
   - Dispatch the `dependency-vetter` agent against the resolved latest version.
   - **On PASS** → update the install to that version, and record the new version, integrity, and date in the repo's provenance.
   - **On NEEDS-REVIEW or REJECT** → do NOT adopt latest. Leave the currently installed (already-vetted) version in place, report the verdict to the user, and note that the update to latest was held back. This is the whole point of the gate: a bad upstream version must not ride in on a routine pack update.
2. If latest equals the currently installed version, there's nothing to update; the recorded PASS still stands.

---

## Phase 4 — Verify and report

1. Frontmatter on every refreshed file still parses (`---` … `---` with `name` and `description`).
2. Every agent name the installed skills dispatch (mainly `skills/orc-review/SKILL.md`) resolves to a file under `.claude/agents/`, and no installed skill names a removed skill or agent.
3. Tell the user: the old and new pack versions, what you refreshed, what you removed, any conflicts and how you resolved them, and — if Phase 3 ran — the `dependency-vetter` verdict and which fallow version is now installed.
4. Remind them the refreshed skills and agents load in a **new** Claude Code session, not the one running the update.
5. When the install has `orc-review` after the update, check for a project review profile. With no `.claude/skills/deep-review/SKILL.md`, tell them to run `/orc-review setup` once: it drafts the profile that tailors the review to this project's stack and architecture. When that file exists without a `based-on: orc-review@` line, tell them `/orc-review setup` converts the hand-written reviewer into a profile. A profile built for an older review template is covered by the `deep-review` rule above.
6. Coming from 1.x, tell them how 2.0.0 works now: `/orc` (or `/do`) builds and commits issues one at a time in the session, they review afterward with `/orc-review` in a fresh session, and `/orc warnings and nits` fixes what it found. `/orc-loop` and `/orc-rush` are gone; `/orc 350-360` or `/orc next 10` covers a batch.
