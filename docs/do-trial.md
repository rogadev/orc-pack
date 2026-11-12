# The `/do` trial (2026-11-07 to 2026-11-12)

Maintainer notes on a one-week trial of `/do` as the main build workflow, and the direction it may set for the pack. Nothing here ships. The evaluation ran on 2026-11-12, and its result shipped as 2.0.0.

## What `/do` is

`/do` is a personal skill at `~/.claude/skills/do/SKILL.md`, outside this repo. It was built from rogadispatch's repo-level `/do`, plus a paceline progress bar. The version under trial is now `skills/orc/SKILL.md`; its history is in git.

It works issues end to end in the main session, one at a time: read, plan, wait for one go-ahead, pin the behavior in tests, build, screenshot UI changes, update the docs, and commit each issue. It dispatches no builder or reviewer agents. Review happens afterward, when the owner runs `/deep-review`, `/orc-review`, or `/deep-review-generic` over the run's commits. It takes repo specifics only from the repo's `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, and hooks, the same way orc's agents do.

## Why the trial

A Wednesday-versus-Friday benchmark in techcentral (2026-11) found `/do` plus a deep review about 45% cheaper per line than the orc workflow, and about 1.6 times faster, at a small quality cost that the follow-up review is expected to make up.

## How orc is switched off for the week

`~/.claude/settings.json` sets these to `off` in `skillOverrides`: `orc`, `orc-loop`, `orc-loop-iter`, `orc-pack`, `orc-rush`, and `orc-rush-iter`. `orc-review` and every agent stay on, because the deep review uses them. To restore orc, remove those entries.

## Changes made during the trial

### 2026-11-07: text mode

`/do` now accepts a plain-text request as well as issue numbers, ranges, and `next N`. The text is worked as if it were an issue.

- **Parsing is strict.** Arguments are an issue list only when every token is an issue reference (`356`, `#356`, `350-360`, commas, issue URLs). `next` counts only alone or followed by a number. Anything else is text, and an issue number inside the text is background, not work.
- **Duplicate check first.** If an open issue already covers the text, `/do` works that issue instead, so it closes at push. If the work is already done, it says where and stops.
- **A brief replaces the issue body.** The text becomes a title, problem, scope, testable acceptance criteria, out-of-scope list, and open questions, saved as `do-brief.md` in the scratchpad so it survives a context compaction. Several separate changes split into items `T1`, `T2`, each with its own commit. Text too vague to write acceptance criteria for is a question to the owner.
- **Always waits for a go-ahead,** even for a small change. Why: with an issue, the scope was written down beforehand; with text, the brief is the agent's own restatement, and a misread scope is this mode's main failure.
- **Files nothing by default.** Typing `/do <text>` isn't a request to file an issue, so commits carry no `Closes` or `Refs` line. "File it" in the go-ahead files one through `/newissue` first.

A `/condense` pass afterward found the file already tight (under 1% saved). It kept the cuts anyway, because one fixed a gap: text-mode commits originally ruled out only `Closes`, not `Refs`.

### 2026-11-07: text mode no longer waits

The forced go-ahead failed in use. The owner's main text request is `/do warnings and nits` right after a deep review, and the answer to "shall I proceed?" was always yes, so the extra turn bought nothing.

- **The text is the go-ahead.** `/do` shows the brief's items as a short plan and starts building in the same turn. It ends the turn first only for a question it can't resolve (criteria it can't write) or one of step 3's stops. Other scope doubts go in the plan message as the reading it chose, so the owner can correct it mid-build.
- **Scope can come from the conversation.** When the text points at items already in the session, such as a review's Warnings and Nits, those items are the scope as reported, and the board search is skipped.

### 2026-11-07: no repo profiles

`/do` started as repo copies in techcentral, stp, and rogadispatch, and the global skill read a repo's copy as a profile whose specifics won over its own steps. Those copies held the old workflow, so old steps could leak into a trial run, and a pack skill that needs a per-repo skill file isn't portable.

- **The repo copies are deleted** (techcentral `a00ee142`, stp `6e531d4`, rogadispatch `776fba95`). The few facts that lived only in them moved into each repo's `CLAUDE.md`.
- **The skill's profile paragraph is gone.** Step 0 now reads repo facts only from `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, the manifest, and `.claude/settings.json`, and ignores any `.claude/skills/do/` left in a repo.

### 2026-11-09: push before review

Every run ended by asking whether to run `/deep-review`, push, or both. The owner's routine is to push to `dev` first, then review in a separate, fresh session: the build session carries a lot of context, and that context can bias the review. So the question offered a step the owner never takes in the build session.

- **The report ends with one question:** "Do you want me to push this to `<branch>`?", naming the integration branch. It still names the review, as the one to run in a new session after the push, and no longer offers to run it.
- **The progress bar puts `push` before `review`.** The report leaves the bar on `push needed`. A finished push marks `review` skipped and finishes the run, because the review happens in another session. A review the owner asks for in the build session still works as before.
- **A review after a push asks whether to push its fixes.**

### 2026-11-09: review-fix tally

The owner's routine after a deep review is `/do warnings and nits`, repeated until a review finds only one or two items (stricter on work projects). Deciding whether to ship needs two facts at the end of each fix run: that it reached `dev`, and how many items it fixed.

- **Step 4 adds a tally** when the run fixed review findings: Blockers, Warnings, and Nits fixed, and how many of each were left open, with why.
- **The bold done line carries the fixed counts,** for example **Done: fixed 1 Blocker, 3 Warnings, and 2 Nits in 2 commits, pushed to `dev`. This run is complete.**
- **A review run in the build session** reports with the same tally.

## Evaluation (2026-11-12)

Measured from the session transcripts and the GitHub boards, per closed issue, with every review session and review-fix run charged to the workflow whose work it reviewed. The `/orc` family ran from 2026-10-15 to 2026-11-05 and `/do` from 2026-11-05 to 2026-11-12. Prices are the pack's model prices (Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50 per million input/output tokens, with cache reads and writes weighted). Active time leaves out time spent waiting for the owner.

In the three repos that used both (techcentral, tctools, rogadispatch):

| Per issue                        | `/orc` family (171 issues) | `/do` + deep review (49 issues) | Change      |
| -------------------------------- | -------------------------- | ------------------------------- | ----------- |
| Cost                             | $35.63                     | $27.33                          | 23% cheaper |
| Uncached tokens                  | 2.23M                      | 1.36M                           | 39% fewer   |
| All tokens, cache reads included | 62.6M                      | 55.9M                           | 11% fewer   |
| Active minutes                   | 68                         | 43                              | 37% faster  |
| Build minutes only               | 63                         | 18                              | 71% faster  |
| Owner prompts                    | 3.9                        | 3.7                             | about equal |
| Changed lines (mean / median)    | 1,694 / 814                | 1,693 / 632                     | similar     |

- **By repo:** techcentral, the largest sample, went from $35 and 66 minutes to $21 and 33 minutes per issue; tctools from $68 to $28. rogadispatch went the other way ($31 to $41) on 11 `/do` issues, one of them a 10,000-line migration.
- **Review is most of `/do`'s cost:** about 60% of it ($801 of $1,339) went to deep reviews and their fix runs.
- **Quality:** first deep reviews averaged 0.14 Blockers and 7.0 Warnings on `/orc` work and 0.12 and 5.6 on `/do` work, so no measurable drop, on a small and uneven sample (seven `/orc` reviews). Three of `/do`'s four Blockers were checks that failed after commit (a format check or test run); `/orc`'s builders ran those before committing. Fix loops converged where the range stood still and didn't where new work landed between reviews. Missing tests, contrast and accessibility, and stale end-to-end tests recurred in both.
- **Not measured:** whether text mode ever built the wrong scope.

## Decision

`/do` met the bar (cheaper and faster per issue, quality on par), so it became `/orc` in 2.0.0:

- **`/orc` is what `/do` was,** with one addition from the evaluation: with no commit gate, it runs the repo's format check, type check, and covering tests before each commit.
- **`/do` stays as another name** for the same skill.
- **No heavy variant.** `/orc-loop`, `/orc-rush`, and their `-iter` skills are gone, along with efficiency mode, the builders, `design-reviewer`, `scope-reviewer`, `next-issue-finder`, `docs-writer`, `impact`, and the builder, work-contract, design-brief, and your-call references.
- **The standards and playbooks** stay, read by `/orc-review`'s lanes only.
- **`/retro`** now measures cost and active time per closed issue, as this evaluation did.

The release notes are the `[2.0.0]` section of `CHANGELOG.md`.
