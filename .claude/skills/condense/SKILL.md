---
name: condense
description: Condense orc-pack's shipped prompts (skills, agents, and orc's reference files) to the fewest tokens that keep every instruction, then prove nothing was lost before keeping a change. Maintainer-only; never ships. Use when the user says "/condense", "condense the prompts", "tighten the prompts", "trim tokens", or "are these files too wordy" after adding or changing pack content.
---

# Condense

You make the pack's prompts shorter without making them weaker. The pack's quality comes from what its agents are told, so a cut that drops or softens an instruction costs more than the tokens it saves.

**The deletion test decides every cut:** if removing a sentence would not change what the reading agent does, remove it. If it would, keep the meaning and shorten only the wording.

## Scope

Condense only text an agent reads at runtime:

- `skills/*/SKILL.md`
- `skills/orc/references/**/*.md`
- `agents/*.md`

Never condense files written for people: `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `LICENSE`, `docs/`, `.github/`, or anything under `.claude/`. `INSTALL.md` and `UPDATE.md` are agent-read but run once per install, so condense them only when the user names them.

Pick the files:

- **No argument:** the in-scope files changed since the latest release tag (`git diff --name-only "$(git describe --tags --abbrev=0)"..HEAD`, plus uncommitted changes). Stable, already-condensed text is left alone.
- **A path or glob:** those files, filtered to the scope above.
- **`all`:** every in-scope file. Warn first that this is a large run.

If nothing is in scope, say so and stop.

## Priority

A token costs more each time its file is loaded, so work in this order and spend the most care at the top:

1. `description:` frontmatter, loaded into every session of every repo with the pack installed.
2. `skills/orc/SKILL.md`, loaded on every `/orc` run.
3. Agent bodies, loaded once per dispatch. Reviewers and builders run on most tasks.
4. Reference files, loaded only when orc detects that stack or needs that standard.

## The rubric

**Cut:**

- **Repetition.** A rule stated twice in one file, or copied into an agent when `skills/orc/references/builder-contract.md` or a standards file already says it. Keep the copy in the shared file and point to it if the reader needs the pointer.
- **Rules that change nothing.** Sentences describing what the model does anyway, or restating the heading above them.
- **Padding.** "In order to", "it is important to note that", "make sure that you", "basically", stacked hedges, and introductions that announce what the next section says.
- **Redundant examples.** An example that only repeats its rule. Keep examples that show an edge case or a format.
- **Implied items.** List entries that the list's category already covers.
- **Prose tables.** The agent reads Markdown source, not a rendered grid, and Prettier pads every cell to the width of the widest cell in its column, so one long row pads every row of the table. Convert a table whose cells are sentences to a bulleted list (`- key: rule`), keeping every row's key and its full content, and merge rows whose content is identical into one bullet that names each key. Keep a table only when its cells are short and the reader compares several columns at once. Wherever a table you convert is named elsewhere ("this table", "its row in the ... table"), update the wording in the same change; a table another file names stays a table unless you update every file that names it.

**Keep exactly:**

- **Strings other files or tools depend on:** file paths, model ids, commands, verdict and status tokens (`FINISHED`, `NOT FINISHED`, `APPROVED`, `REVISE`, `PASS`, `REJECT`, Blocker/Warning/Nit), report section names, and any heading another file refers to by name.
- **Constraints and their strength.** Every "never", "always", "must", threshold, limit, and ordering. "Never" does not become "avoid"; "must" does not become "should".
- **The reason behind a non-obvious rule.** The reason is what lets an agent handle a case the rule did not foresee. Cut a reason only when the rule is self-evident.
- **Trigger phrases** in `description:` fields. Shorten the summary part of a description, never its "Use when" phrases.
- **Frontmatter shape and the `pack:` marker** on line 3.
- **The repo-agnostic and defer-to-the-repo wording.** These sentences carry the pack's design; see `CLAUDE.md`.

**Never compress by dropping words from sentences.** No telegraphese, dropped articles, invented abbreviations, or symbols for words. It saves little and makes instructions harder to follow exactly. The savings come from removing whole sentences and duplicates; the sentences that stay are full, plain English.

## Process

### 1. Baseline

Record each file's word count (`wc -w`) and character count (`wc -m`), and estimate tokens as characters / 4. The estimate is for comparing a file before and after, which is all the report needs. Save the original of every file to the scratchpad so any section can be restored.

### 2. Inventory, rewrite, and verify each file

Dispatch one `general-purpose` agent per file with `model: "opus"`, in parallel. Give each agent the file path, this skill's path (`.claude/skills/condense/SKILL.md`) for the rubric, and the paths of the shared files its content may duplicate (`builder-contract.md` for builders, the standards files it reads). Each agent:

1. **Inventories before editing.** Writes to the scratchpad a numbered list of every obligation in the file: each instruction, constraint with its strength word, threshold, exact string, output format, and stated reason.
2. **Rewrites** the file in place under the rubric.
3. **Reports** the inventory path, the cuts made by category, and anything it chose to keep despite looking cuttable.

Then dispatch a separate `general-purpose` verifier with `model: "opus"` per file. It gets the inventory and the rewritten file, never the original text, so it judges the new text cold. For each obligation it answers **kept**, **weakened**, **ambiguous**, or **missing**, quoting the new line that carries it. It also flags any sentence in the new text whose meaning a cold reader could misread.

For every obligation not marked **kept**, restore the original section or fix the wording, then re-verify that section. A file is done only when every obligation is kept.

### 3. Check cross-file references

The rewrite can break a link between files. For every changed file, confirm that:

- Every heading another file names (`grep` the pack for the heading text) still exists word for word.
- Every path the file mentions still resolves.
- Every agent name a skill dispatches still exists under `agents/`, and every reference file `skills/orc/SKILL.md` names still exists under `skills/orc/references/`. These are the checks `.github/workflows/pack-integrity.yml` runs in CI.
- The **Standards** list in `skills/orc/SKILL.md` still matches which agent reads which standard.
- No text still calls a converted table a table: `grep` the pack for "table" near the converted section's name.
- Every `pack:` marker is unchanged.

### 4. Format and record

1. Run `npx prettier@3 --write .`, which is what the release guard runs.
2. Add a changelog line. A change under `skills/` or `agents/` triggers a release, and the guard publishes nothing without a section for that version. If the version in `.claude-plugin/plugin.json` has no git tag yet, add a bullet to that version's section in `CHANGELOG.md`. Otherwise add a `## [x.y.z]` section for the next patch version, following the release-note format at the top of `CHANGELOG.md`. Either way, name the condensed files and say there is no behavior change and no update step beyond refreshing them.
3. Do not commit. The user reviews the diff.

## Report

End with:

- **Files condensed:** a table of file, words before and after, estimated tokens before and after, and percent saved, with a total row.
- **Biggest cuts:** the largest removals by category, one line each, for example "removed the scope rules repeated from `builder-contract.md` in four builders".
- **Kept on purpose:** text that looked cuttable but stayed, and why.
- **Restored:** obligations the verifier caught and how each was fixed.
- **Changelog:** the section edited.

Leave a file unchanged if condensing it would save under 3% of its tokens, and list it as "already tight".
