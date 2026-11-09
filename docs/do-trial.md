# The `/do` trial (2026-11-07 to 2026-11-12)

Maintainer notes on a one-week trial of `/do` as the main build workflow, and the direction it may set for the pack. Nothing here ships. The evaluation is on Thursday 2026-11-12; until then, nothing in `skills/` or `agents/` changes because of this trial, and nothing from it goes to `main`.

## What `/do` is

`/do` is a personal skill at `~/.claude/skills/do/SKILL.md`, outside this repo. It was built from rogadispatch's repo-level `/do`, plus a paceline progress bar. A snapshot of the version under trial is in [`do-trial-skill.md`](do-trial-skill.md); the live file can change during the week, so compare against it.

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

## The direction under consideration

Decided on 2026-11-12, not before. The owner is leaning toward:

- **`/orc` becomes what `/do` is today:** the main path, high quality, single session, review afterward.
- **A heavy variant** (working name `/orc-heavy`) keeps today's subagent-driven `/orc` and `/orc-loop` for work that needs it.
- **`/orc-rush` and `/orc-loop` are dropped** as separate skills, along with their `-iter` companions.
- **Efficiency mode goes away,** because the `/do`-style path is the cheap path.

Open questions for the evaluation are in the next section.

## Questions for the evaluation

- Did `/do` plus a deep review catch what an `/orc` run would have caught? Compare the review findings per run with past `/orc-loop` reports (`<git-dir>/orc-loop/reviews/`).
- Did text mode's brief match what the owner meant once it stopped waiting for a go-ahead, and did any run build the wrong scope?
- Does the heavy variant cover both a single issue and a batch, or does batching move into the main `/orc` only?
- What happens to the agents only the heavy path uses (the builders, `design-reviewer`, `scope-reviewer`), and to `/retro`, which reads `/orc` run artifacts?
- Renaming `/orc` changes what installed users get, so it is a breaking release (2.0.0) and needs an `/update-orc` migration step in `CHANGELOG.md`.
