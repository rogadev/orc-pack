---
name: update-orc
pack: orc-pack@1.7.0
description: Update an installed orc pack (the copied-into-.claude/ kind) to the latest released version, from any older version in one pass. Reads the local pack version and provenance, finds the latest GitHub release, fetches the pack at that tag, builds the cumulative update map from every changelog entry in range, and dispatches the orc-updater subagent (Opus 5.5) to converge the install on the latest kit. Use whenever the user says "/update-orc", "update orc", "update the orc pack", "is there a newer orc", "refresh orc", or "get the latest orc-pack".
---

# Update Orc

You bring an installed orc pack up to the latest released version. You run inside the target repo where the pack is already installed. The pack's own `CHANGELOG.md` is the update map and the fetched `UPDATE.md` is the procedure; this skill finds the version, fetches the kit, assembles the map across **every release the install is missing**, dispatches the updater, and verifies the result.

**Assume the install may be many releases behind.** Do not treat this as a step from the previous release to the latest. Establish where the install is, where the target is, and everything in between, then converge on the target kit as an absolute state. A one-release jump and a ten-release jump go through the same path; only the map's size differs.

## Outcomes

Three, mirroring orc:

- **`UPDATED to x.y.z`** — the install now matches the target release and verification passed.
- **`ALREADY CURRENT (x.y.z)`** — no newer release; nothing to do.
- **`UPDATE FAILED`** — a blocker that needs the user: no network or `gh`, no usable update map and no diff, an unrecoverable conflict, or verification failed.

## Workflow

### 1. Find the install

Read, in order:

- `.claude/orc-pack.provenance.md` (or `~/.claude/orc-pack.provenance.md` for a global install) for the source repo, the installed version, and any recorded local edits.
- The `pack: orc-pack@x.y.z` marker in `.claude/skills/orc/SKILL.md`.

Determine:

- **Installed version** and **install root** (the `.claude/` directory holding `skills/` and `agents/`).
- **Source repo** — the GitHub `owner/repo` recorded in provenance; default `rogadev/orc-pack`.
- **Install kind** — if there is no copied `.claude/skills/orc/SKILL.md`, this is not a copied install. Say so; if the plugin is installed, tell the user to run `/plugin update orc-pack@orc-pack`. Stop.
- **Local shape** — which pack files exist, and whether provenance is present. An old install may predate provenance or agents added later; a missing file is expected, not an error.

### 2. Find the target

```bash
gh release view --repo "<owner/repo>" --json tagName,name,publishedAt,body
```

If `gh` is missing or unauthenticated, stop with that blocker. Take the latest release's tag, strip a leading `v`, and compare semver against the installed version.

- Installed >= target → report `ALREADY CURRENT` and stop.
- Target > installed → continue, and record the **range** `(installed, target]`.

### 3. Build the cumulative update map

Fetch the pack at the target tag first (step 4), then read the target kit's `CHANGELOG.md`. It is ordered newest-first and carries a section per version. Assemble the map from **every section whose version is greater than the installed version and no greater than the target**, restored to ascending order, and write it to `<scratchpad>/migration-map.md`.

That map is what tells the updater about renames, removals, non-file steps, and migrations that a plain file copy would miss — across the whole gap, not just the latest release. For each in-range version, carry its **Changed areas**, **Update steps**, **Breaking changes**, and **Files to read** verbatim; do not summarize away the specific paths.

**If the map is thin or absent** — no in-range sections, or entries with no changed areas — fall back to the diff: the file and commit diff from the installed state to the target. Prefer the installed tag (`git diff v<installed>..v<target>`) when that tag exists; earlier versions may predate tagging, in which case compare the installed pack files against the fetched kit directly. Hand the updater the diff and label the map a fallback in the report. Thin release notes are a release-process gap worth naming, but they do not block the update.

Also read the **latest release body** (`body` from step 2) for anything not captured in the changelog.

### 4. Fetch the kit at the target tag

Into the session scratchpad, never into the target repo:

```bash
gh repo clone "<owner/repo>" "<scratchpad>/orc-pack-<target>" -- --branch "v<target>" --depth 1
```

Confirm `<scratchpad>/orc-pack-<target>/skills/orc/SKILL.md` exists and its marker reads `pack: orc-pack@<target>`; if not, the tag or clone is wrong — stop. The fetched kit is the **absolute target**: the updater's job is to make the install match it (modulo intentional repo edits), not to replay deltas.

### 5. Dispatch the updater

Dispatch `orc-updater` with **`model: claude-opus-5-5`** explicitly. Never pass a bare `opus` alias: Claude Code runs an alias subagent on the session's own model when both are Opus, so a session on Opus 5 would take the updater with it. Give it:

- The fetched kit path and the target install root.
- The installed version, the target version, and the full range between them.
- The migration map from step 3 (or the diff fallback), quoted verbatim.
- The latest release body.
- Instruction to follow the fetched kit's `UPDATE.md` phases in order, converge the install on the fetched kit file by file, re-apply preserved local edits, run every in-range **Update steps** item, and re-record provenance.
- The constraint that files without a `pack:` marker belong to the repo and are never clobbered — except files under `skills/orc/references/`, which are pack-owned and refreshed from the kit like any marked file.

### 6. Verify convergence

The update passes only when the install matches the target kit:

- Every file under the fetched kit's `skills/` and `agents/` exists in the install with the same content, **except** files with a documented, intentional repo-local edit (which must be listed).
- Every refreshed skill and agent file's `pack:` marker equals the target version, and every frontmatter block still parses (`name` and `description`). Reference files carry no marker; they pass when their content matches the kit's.
- No file the target kit dropped remains in the install.
- Every agent the refreshed skills name resolves to a file under the install's `agents/`.
- `.claude/orc-pack.provenance.md` records the target version, the date, the source, and every file overwritten, renamed, added, or removed.
- Any third-party-tool re-vet named in the in-range **Update steps** ran.

A file that differs outside that allowed list is a failure, not a nit — report it under `UPDATE FAILED`.

### 7. Report

Lead with the version transition and the size of the jump. Headings, dropping empty ones:

- **Updated** — `x.y.z -> a.b.c` (n releases), the files refreshed, added, renamed, or removed, and anything left uncommitted.
- **Map** — whether the update used the changelog sections, the diff fallback, or both, and which versions were in range.
- **Your call** — anything needing the user, or "Nothing."

Then the status line, exactly one of:

```
**UPDATED to x.y.z**
```

```
**ALREADY CURRENT (x.y.z)**
```

```
**UPDATE FAILED** — <one line: the blocker and the action that clears it>
```

Nothing after it.

## Guardrails

- **Converge, do not replay.** The target kit is the source of truth; the changelog explains the special cases. A file copy that matches the kit is correct even if no changelog entry mentions it.
- **Never clobber a file without a `pack:` marker** (the pack-owned `skills/orc/references/` files excepted), and never silently drop a repo-local edit.
- **Do not commit or push** unless the user asks. Leave the refreshed files in the working tree and say so.
- **Never force-push, rebase, or rewrite history.**
- **Do not run `/orc`.** This skill only refreshes the pack.
