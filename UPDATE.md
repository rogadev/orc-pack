# UPDATE — agent instructions for updating the orc pack in a repo

**You are an agent updating an existing orc-pack install** in a target project — refreshing the skill and agents to a newer version of the pack. This is the sibling of `INSTALL.md`: install puts the pack in for the first time; update refreshes what's already there without clobbering the repo's own edits.

If the pack was installed as a Claude Code **plugin** (`/plugin install orc-pack@orc-pack`), you don't update by hand — the plugin receives new versions when `.claude-plugin/plugin.json`'s version moves. This doc is for the **copied-into-`.claude/`** install, where the files live in the repo and you refresh them from a fresh clone of the kit.

For a copied install, the `/update-orc` skill automates this document end to end: it finds the latest release, fetches the kit at that tag, and dispatches the `orc-updater` agent to run these phases, with every changelog entry between the installed and target versions as the map. Read this document when you are updating by hand, doing a custom or partial update, or writing or debugging the updater prompt. An install may be several releases behind, so apply the phases against the **target kit** as an absolute state rather than replaying one release at a time.

Work the phases in order.

---

## Phase 1 — Locate the current install and the new kit

1. Find the installed pack: `.claude/skills/orc/SKILL.md` and `.claude/agents/*.md` carrying `pack: orc-pack@<version>` markers. Read the recorded version from `.claude/orc-pack.provenance.md`.
2. Have the new kit checked out somewhere outside the repo (the user points you at it).
3. Compare versions. If the kit is not newer, there's nothing to do — say so and stop.

---

## Phase 2 — Refresh the pack files

For every kit file (the mapping table in `INSTALL.md` Phase 2 is authoritative):

- **File has a `pack:` marker** → an earlier install of this pack. Overwrite with the kit version, then re-apply any repo-specific edits the repo made since (its git history for that file shows them).
- **File has no `pack:` marker** → the repo's own artifact. Do not clobber it; route through `INSTALL.md` Phase 3 conflict handling.
- **A new agent or skill in the kit that isn't in the repo yet** → copy it in, same as a fresh install.
- **A file the new kit dropped** → remove the stale copy and note it in the report.

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
2. Agent names still match the references in `skills/orc/SKILL.md` (if the update added or renamed any).
3. Tell the user: the old and new pack versions, what you refreshed, any conflicts and how you resolved them, and — if Phase 3 ran — the `dependency-vetter` verdict and which fallow version is now installed.
4. Remind them the refreshed skill and agents load in a **new** Claude Code session, not the one running the update.
