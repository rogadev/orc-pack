---
name: newissue
pack: orc-pack@1.6.1
description: Turn a rough idea into a detailed, self-contained GitHub issue a fresh agent could execute with zero prior context. Use whenever the user says "/newissue", "file an issue", "make this an issue", "open a GitHub issue", "write this up as an issue", "track this", or okays filing an issue you surfaced. Investigates the code, checks the board for duplicates and drift, then files with `gh`. Do NOT invoke for an issue the user has not asked for or approved — surface the idea and ask first.
---

# New Issue

You turn a rough idea into a GitHub issue that stands entirely on its own. The test every issue must pass:

> An agent picks this up in three weeks. It has never seen this conversation, this branch, or your reasoning. Does it know exactly what to do, and why it's worth doing?

**Two readers, always.** A **non-technical stakeholder** — a PM tracking the board — reads the **title** and the **first paragraph**: write those in plain language, with no symbol names, file paths, or mechanism. A **technical agent** reads the rest to execute it: full technical detail from the second section down. When the two pull in different directions, the title and lead paragraph serve the stakeholder; the precision lives one section down.

**You file the issue. There is no approval gate.** By the time `/newissue` is invoked, the decision to file has been made. Do the work, file it, hand back the URL.

## Input

- `/newissue <rough idea>` — the seed. A starting point, not a spec; it may be wrong.
- `/newissue` with no argument — file the thing just discussed in this conversation.

## House rules (per-repo config)

This skill is the engine and is identical in every repo. Per-repo specifics — the label and `[TYPE]` tag vocabulary, milestones or a project board, required extras, issue tone — live outside it. Honour the first that exists:

1. `.claude/newissue.local.md` in the repo root.
2. A `## New issue house rules` (or clearly equivalent) section in the repo's `AGENTS.md` or `CLAUDE.md`.

**House rules win over any default here.** When none exists, fall back to what `gh label list` and `.github/ISSUE_TEMPLATE/` tell you, and proceed. Never invent house rules: if the repo has no milestones or board, file a clean issue with labels and body only.

## Workflow

### 1. Ground yourself

Run in parallel:

```bash
gh repo view --json nameWithOwner,defaultBranchRef
git branch --show-current
git log --oneline -10
gh label list --limit 100
gh issue list --state open --limit 100
gh issue list --state closed --limit 40   # recently closed — catch already-shipped or wontfix'd requests
```

If `gh` isn't authenticated or this isn't a GitHub repo, stop and say so. Load the house rules now. Check `.github/ISSUE_TEMPLATE/` — honour a template's required fields; a thin template is a floor, not a ceiling.

### 2. Investigate before writing a word

- **Read the actual code.** Cite `file:line`. If the claim rests on a framework default or a dependency's behaviour, read and cite that too — `node_modules/...` is fair game when it's the reason.
- **Check history.** `git log`/`git blame` on the relevant lines. Code is usually the way it is on purpose; find that purpose if you can, and say so if you can't.
- **Verify the claim still holds** on the current branch. A bug fixed two commits ago doesn't get filed — tell the user instead.
- **Reach outward only when the issue is about the outside** — Sentry for a runtime error, `curl` for live-site behaviour, upstream docs for an API contract.

Stop digging once the issue is executable.

### 3. Check the board

Two passes, both required.

**Duplicates.** A genuine match → don't file; report it and offer to comment there instead. Near-misses aren't duplicates — file yours and cross-link. Check recently-closed too: an already-shipped or `wontfix`'d request should not be re-filed — surface the closed issue and stop.

**Direction drift** — the pass people skip, and the one that costs. If this issue moves the project from X toward Y, find every open issue that still assumes X; whoever picks one up later would quietly revert Y. For each affected issue: name it under `Supersedes / conflicts with` with one line on what goes stale, and post a short comment on it pointing back (`gh issue comment <n>`).

**Dependencies.** Classify the rest: **would be resolved by** an open issue → surface it and stop rather than filing covered work; **blocked by** → file anyway, name `Blocked by #NNN`, don't imply it's ready; **blocks** → file, note `Blocks #NNN`, comment on the blocked issue; **parent/child** → file and link both ways — a child still stands on its own.

**Do not close or edit other issues.** Flag them; that call is the user's.

### 4. Decide the shape: one issue, several, or an epic

Size for the executor: each filed issue should be a unit one autonomous agent run can carry to done. Two reasons to split, one reason to go bigger:

- **One issue** — a single coherent unit with one "Done when", small enough for one run. The common case.
- **Several issues** — either the seed bundles unrelated work (a bug _and_ a feature — two pieces in one issue wrecks board tracking), or it's one coherent fix or feature that's simply too large for a single run. Split the large one by aspect, each issue self-contained with its own "Done when", cross-linked with `#NNN`; when one must land first, say so (`Blocked by #NNN`).
- **An epic** — work so large and interconnected it needs a roadmap (a sweeping refactor, a multi-stage migration). File a parent tagged `[EPIC]` (matching the repo's convention) whose body is the plain-language goal, the why, and a task list of the children **in execution order — the list is the roadmap**; file each child as its own self-contained issue, linked both ways (`Part of #NNN` / `- [ ] #NNN`). "See the epic" is not context. Don't manufacture an epic for an ordinary multi-file change — two cross-linked issues beat a ceremony parent.

### 5. Write for a stranger

Zero conversation context:

- Repo-relative paths, always — `src/lib/server/trust.ts:42`, never "the trust file". Name the branch when it isn't the default. Commands runnable as written.
- No phrase pointing at this conversation ("as we discussed", "per the above") — the fact it refers to belongs in the issue. Spell out what the reader would otherwise have to infer from your session: which environment, which deploy, which of two similar functions.

**Required content** — headings adapt to type (a bug leads with what breaks and how to reproduce, a feature with the need, a chore with what's accumulated and why now). Drop a section rather than pad it — but if you're dropping "Evidence" or "Done when", you haven't investigated enough.

- **Summary (plain language)** — the _first_ paragraph of the body, no heading above it, so the board reader always finds it in the same place. One short paragraph a PM with no engineering background grasps at a glance: what this is and why. No paths, symbols, or jargon — those begin in the next section. For a bug: the effect and the stakes in ordinary terms, not the mechanism.
- **What** — the concrete situation in full technical detail. This is where the symbols and paths begin. No hedging.
- **Why it matters** — the consequences, numbered by severity when there's more than one.
- **Evidence** — `file:line`, real command output in fenced blocks, error IDs, Sentry links, commit SHAs. Show the thing; don't describe having seen it. For anything visual, a screenshot or mockup beats prose — reference one, or note where the developer should drop one in.
- **Fix / approach** — the shape of the change, the files involved, the constraints. When the answer isn't code, say so plainly.
- **Scope and non-goals** — what is explicitly _not_ part of this, tempting adjacent work named. This keeps a two-line fix from becoming a refactor.
- **Done when** — an observable condition, not a feeling.
- **Supersedes / conflicts with** — from the board check, when there's anything to say.
- **Open questions** — only the genuinely undecidable, each with the assumption you proceeded under. If this section is long, you should have stopped and asked.

Match the repo's prevailing tone; read a recent well-written issue if one exists.

### 6. File it

```bash
gh issue create \
  --title "<title>" \
  --body-file - \
  --assignee @me \
  --label "<label>" <<'EOF'
<body>
EOF
```

- **Title** — type-tagged, plain-language, and a specific claim, all three at once:
  - Lead with a bracketed type tag — `[BUG]`, `[FEATURE]`, `[CHORE]`, `[EPIC]` — matching the repo's convention if it has one.
  - Words a non-technical stakeholder understands: name what's affected and what's happening, not the symbol, file, status code, or mechanism — those belong in the body, never the title.
  - Still a specific claim, not a topic. `[BUG] Several tools break on the deployed site` works for both readers; `[BUG] PR deploy: health dots red + multiple tools 500 (likely env/egress in pr-7f3a1c)` loses the board reader; `[BUG] Deploy issue` is a topic and helps no one.
- **Labels** — only from `gh label list` (or the house-rules set); never invent one. The type label must agree with the title tag; add the area label when one fits; priority only when genuinely obvious — a guessed priority is worse than none. Nothing fits → file unlabelled.
- **Milestone & project** — apply what the house rules name (`--milestone`, `gh project item-add`); if the repo uses neither, skip.
- **Assignee** — `@me`.
- **Links** — related issues (`#12`), the PR or commit that introduced the code, inline where relevant.

Report the URL back.

### 7. Self-check before filing

1. Passes the stranger test at the top of this file?
2. Every claim has evidence behind it?
3. No pronoun or reference pointing at this conversation?
4. No "TBD", empty section, or hedge a decision would resolve?
5. "Scope and non-goals" actually bounded?
6. Title: type-tagged, plain enough for the PM, still a specific claim?
7. First paragraph: understandable with zero technical background?
8. Shape: genuinely one issue, or did a second issue or an epic get smuggled in?
9. Type label agrees with the title tag; priority obvious or absent?
10. Board check covered recently-closed issues too?
11. Blocked-by / blocks / would-be-resolved-by relationships surfaced and linked?

Fix inline. Then file.

## The one stop condition

File by default. Stop and ask only when proceeding would produce a _wrong_ issue: the premise didn't survive investigation; the shape is genuinely undecidable even after step 4; or a duplicate — open, or recently closed and settled — already covers it. Everything else is an ordinary judgment call: make it, note the assumption in the body, file.

## What this is not

- Not a PR description — that's a separate flow.
- Not a plan. What and why, with enough how to be executable; not every step.
- Not a place to think out loud. Only conclusions and evidence land in the body.
