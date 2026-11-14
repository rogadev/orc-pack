---
name: orc
pack: orc-pack@2.1.0
description: Works GitHub issues end to end in any repo, one at a time in this session - read, plan, pin the behaviour in tests, build, screenshot UI, update the docs, and commit each issue, with the run shown as a paceline progress bar. Takes one issue, a list, a range, "next N" to pick the N most important open issues from the board, or a plain-text request to work as if it were an issue, for example "/orc 356", "/orc 356 357 360", "/orc 350-360", "/orc next 10", or "/orc add a CSV export to the reports page". `/do` is the same skill under another name.
argument-hint: "<issue> [<issue> ...] | <first>-<last> | next [N] | <text request>"
disable-model-invocation: true
---

# Orc: work GitHub issues

Work the issues in `$ARGUMENTS` on the integration branch, in this session, one at a time. Build in the main session: no builder agents, no reviewer agents, and no review skills unless the owner asks. Send wide code searches to Explore with `model: "haiku"`, so file dumps stay out of context and searches don't run on the session's model. Track each issue as a native Task (`TaskCreate`), marking it `in_progress` and `completed` as you go, and mirror the run on the progress bar (see **Progress bar**). `/do` runs this same skill; everything here applies to it unchanged.

**Not on Opus 5.** If you are Opus 5 (`claude-opus-5`, the 5.0 release), stop before touching the repo and say so: in our testing it hallucinates, drifts off task, and reports problems that aren't there. Tell the owner to run `/model claude-opus-5-5` and start again, and that they own this skill and can remove this check.

## 0. Learn the repo

Read the repo's `CLAUDE.md` or `AGENTS.md`, its `.claude/rules/`, and its manifest, to find the integration branch (usually `dev`), the commands for type checking, tests, and the full ready check (for example `pnpm ready`), the dev server and its port, where tests and docs live, and any UI verification recipe.

**Repo facts come only from the repo's own docs and hooks.** Its docs to read, guards and gates, schema workflow, screenshot recipe (port, sign-in, headers, widths), ready command, and board ranking come from the files above and `.claude/settings.json`, and they win over the general steps here. This skill holds the whole workflow; a repo needs no per-repo copy of it.

**Gates.** Check the repo's `.claude/settings.json` for hooks that gate `git commit` and the finish (a commit gate or Stop gate that runs the type check, related tests, and a test-integrity check):

- **Gates present:** rely on them. You don't run those checks by hand to prove anything.
- **No gates:** before each commit, run the repo's format check, the type check, and the tests that cover the files you changed, and confirm you deleted no test, added no `.only` or `.skip`, and removed no assertion. A commit that fails the repo's own checks is the most common defect a later review finds, so never skip this.

Either way, when a check fails, fix the cause. Never weaken, skip, or delete a test to get green. Retry a blocked commit unchanged only when a flagged item is intended, such as a test removed with the code it covered, and say why in your reply. A real failure you can't fix is a stop: ask the owner.

## 1. Resolve the list

1. Parse `$ARGUMENTS`:
   - Issue numbers separated by spaces or commas, with or without `#`, inclusive ranges such as `350-360`, and issue URLs. Expand the ranges. This is list mode only when every token is one of these.
   - `next N` (or `next` alone, which means `next 1`): pick the N most important open issues from the board, as described in **Picking the next N**. Only `next` alone or `next` followed by a number counts; `next steps for the auth page` is text.
   - Anything else is a text request: follow **Working a text request** instead of steps 2 to 4 below. An issue number inside the text (for example "like #356") is background to read, not work to do.
   - With no arguments, ask which issues to work.
2. Fetch each one with `gh issue view <n> --json number,title,state,body,labels,comments`. Drop pull requests, closed issues, and numbers that don't exist, and list them in the report.
3. Confirm each issue is still open in the code: `git log <branch> --oneline --grep "#<n>"` and a look at the code it names. If it's already fixed, comment with the commit that fixed it, close it, and drop it. In `next N` mode, replace a dropped issue with the next one in rank, so the list still holds N.
4. Order the list by issue number, unless one issue blocks another (`blocked by #N`, or a dependency the code shows). In `next N` mode, keep rank order instead, adjusted only for blockers.
5. Stay on the integration branch in this checkout: no new branch and no worktree. Leave files that another session left uncommitted alone, and never stage them.

### Working a text request

The text is the issue. Treat it exactly like one from here on, with these differences:

1. **Work this conversation names comes from this conversation.** When the text points at something already here, such as "warnings and nits" right after a review, or "the three follow-ups you listed", its scope is those items exactly as they were reported. Skip the board search in the next step and build the brief from them.
2. **Check it isn't already tracked or done.** Search the board, open and closed (`gh issue list --state all --search "<key words>"`), and `git log <branch> --oneline` for the same work. If an open issue covers it, say so and work that issue in list mode, so it closes at push. If the work is already done, say where and stop.
3. **Write the brief.** Turn the text into an issue's shape: a title, the problem, what's in scope, testable acceptance criteria, what's out of scope, and open questions. Read the code it touches first, so the scope is grounded. Save it as `orc-brief.md` in the scratchpad; that file is the issue body from now on, and the build is held to it. Don't widen the scope past the text.
4. **Split when it's several things.** If the text holds separate changes, make each one an item (`T1`, `T2`, and so on) in the brief, each with its own criteria and its own commit. One coherent change stays one item.
5. **Too vague to test is a question.** If you can't write acceptance criteria for an item, ask the owner rather than guessing.
6. **Don't file an issue** unless the owner says to (for example "file it" in the text). If they do, file it with `/newissue` from the brief before building, and from then on it's that issue.

**The text is the go-ahead.** Typing `/orc <text>` (or `/do <text>`) already says yes, so don't stop to ask whether to proceed. In step 2, show the brief's items as the plan in a short message, then start building in the same turn. End the turn before building only for a question in item 5, or for one of the stops in step 3; any other doubt about scope goes in the plan message as the reading you chose, so the owner can correct it while you build. Commits carry no `Closes` or `Refs` line unless an issue was filed.

### Picking the next N

If the repo documents its own ranking (a roadmap or priority rule in `CLAUDE.md` or `.claude/rules/`), follow it. Otherwise read the board with `gh issue list --state open --limit 200 --json number,title,labels,milestone,body,createdAt`, then rank:

1. **Leave out** pull requests, issues labelled `in progress` (another session owns them), `wontfix`, `duplicate`, `invalid`, or `question`, and issues whose body says `blocked by #N` while #N is still open.
2. **Urgent first:** anything labelled `p0` or critical, and any security issue, labelled or not.
3. **Then by priority:** `p1`, `p2`, `p3`, then issues with no priority label. If the repo has an open milestone, issues in the one with the nearest due date go first within each priority.
4. **Within a priority:** `bug` before other types, then an issue that unblocks others before one that doesn't, then the oldest first.
5. **Size check:** an epic or tracking issue (a checklist of other issues) isn't work itself; take its open children in its place. Don't take an issue whose acceptance criteria are too vague to test; list it in the report as needing a rewrite.

Show the ranked list with each issue's priority and one line on why it made the cut, as part of the plan message in step 2.

## 2. Plan, then wait for one go-ahead

For each issue, read the issue, the docs that cover its area (architecture notes, specs, UI patterns, ADRs, and the matching `.claude/rules/` file), and the code. Then write its plan:

- **Small change** (copy, a one-file fix): one line saying what changes and where.
- **Anything larger:** the files, the approach, the risks, and how you'll know it's done: the test names, the routes and roles to screenshot, any schema change and its migration, and the doc to update. The bar is that someone who never saw this conversation could build from it.

With one small issue, state the one-line plan and start building. A text request never waits for a go-ahead; see **Working a text request**. Otherwise put every plan in one message, in build order. Note where two issues touch the same code, and ask any question only the owner can answer. Then end your turn and wait. The owner approves, edits, or drops items, and that one go-ahead covers the whole list.

## 3. Build each issue in order

Work through the approved list without stopping between issues:

1. **Pin the behaviour.** Write the tests for new logic from the plan first, where the repo keeps its tests. For a bug, start with a failing test that reproduces it. After that, change the code, not those tests.
2. **Build it,** at the scope the plan set. Fix a small problem next to your change and mention it. Note anything larger or unrelated for the report instead of building it or filing it.
3. **Schema changes:** use the repo's own migration tool and keep the migration additive. Apply it only to a local or test database and confirm it landed. Never point a database command at a shared or production database.
4. **Look at UI changes** with the repo's verification recipe when it has one. Otherwise use a running dev server, or start one in the background, and screenshot each changed route with a Playwright script in the scratchpad, signed in as the role the change is for:
   - at 390 and 1440 pixels wide
   - in light and dark (`colorScheme`, with no saved theme)

   Name each file `<issue>-<route>-<width>-<theme>.png`. Look at every shot yourself, and fix what's wrong before moving on.

5. **Update the docs** in the same change when the behaviour they describe changes: the matching doc or spec, the README, or a `.claude/rules/` file. Docs carry no issue numbers, dates, or checklists. If the change contradicts a doc, spec, or ADR, stop and ask the owner before building it.
6. **Commit** one commit per issue, with only that issue's files, through `commit-commands:commit` when that plugin is installed:
   - The subject names the change.
   - The body has one line per change, plus `Closes #<n>`, or `Refs #<n>` when the issue is only partly done.

Stop partway through the list only for one of these, and say which issues are done and which remain:

- a doc, spec, or ADR contradiction
- a decision only the owner can make
- a plan that turns out to be wrong
- a failure you can't fix

## 4. Report

Before reporting, run the repo's ready check once over the whole run, plus the `fallow` agent when the run removed or moved code and the repo uses fallow. Fix what they find, in the commit of the issue that caused it.

Then, for each issue, give:

- what changed, in a line or two, and its commit hash
- the gate result
- the full paths of its screenshots
- anything skipped, found, or still open

Then list the dropped numbers and why.

**When the run fixed review findings** (a text request scoped to a review's items, such as `/orc warnings and nits`, or a review in this session), add a tally by the review's severities: how many Blockers, Warnings, and Nits were fixed, and how many of each were left open, with why. The bold done line carries the fixed counts.

If this run started the dev server, stop it and confirm its port is free.

**Update check.** Run the check in `references/update-check.md` (in this skill's base directory). When a newer release exists, its one line goes just above the closing line.

**Don't mention a review.** The owner decides on their own whether to re-review, and does it in a fresh session. Never say that no review has run, never name a review to run, and never offer one.

**When the request already said to push** (for example "push to dev when finished" or "and push"), push as **When the owner says push** describes before writing the report, without asking. Otherwise, end with one question, naming the integration branch: "Do you want me to push this to `<branch>`?"

**End every finished run with one bold line, on its own, as the very last thing in the reply,** so the owner sees at a glance that the run is complete. For example: **Done: 8 commits pushed to `dev`. This run is complete.** After a review fix: **Done: fixed 1 Blocker, 3 Warnings, and 2 Nits in 2 commits, pushed to `dev`. This run is complete.** When the push is still waiting on the owner, the question above takes that place instead. Put nothing after that line, not even a caveat or a follow-up offer; anything the owner should know goes above it.

## When the owner asks for a review

This covers "review", and the owner running `/orc-review` (or the project's `/deep-review`) right after this run. Run the review over the range this run committed. Fix every confirmed Blocker and Warning in the main session, commit the fixes (a subject that names the change, never the review), and re-review the fixes once. Report what the review found, with step 4's tally of what you fixed and what's still open. Then push or ask about it, and end with the bold done line, as step 4 says.

## When the owner says push

Push the integration branch and confirm `git status` shows it up to date with its remote. Then, for each issue that's fully resolved, comment and close it:

```bash
gh issue comment <n> --body-file <scratchpad>/issue-<n>.md
gh issue close <n>
```

The comment says `Done in <sha> on <branch>.`, then two or three lines on what changed and where, then `It's on <branch>, not released yet; it goes out with the next promotion.` A partly resolved issue gets the comment, saying what landed and what remains, but stays open. A text request has nothing to comment on or close: mark `land`'s `close` stage done once the push lands. Never open the promotion PR unless the owner asks.

## When the owner corrects you

If the owner corrects something you should have known, propose the check that would have caught it: a lint rule, a test, or a hook first, and one line in `CLAUDE.md` or a `.claude/rules/` file only when nothing deterministic fits.

## Progress bar

When the [paceline](https://github.com/rogadev/paceline) `progress_*` tools are available, mirror the run as a status-line bar. Without them, skip this section silently and never install, mention, or ask about them. If they are deferred, load all five (`progress_start`, `progress_step`, `progress_add_steps`, `progress_label`, `progress_finish`) in one tool search during step 1. Send each call in the same message as a tool call you are already making; the tool search is the only bar call that may stand alone. If a call fails, drop the bar and carry on.

Paceline only appends steps and never reshapes one, so start small and add the rest once the plan is approved.

- **Start** in step 1, once `$ARGUMENTS` parses: one `progress_start` named `orc` (`orc #356` for a single issue, `orc: <short title>` for a text request), with one step: `id` `plan`, `label` `plan`, `weight` 1, `stages` `["resolve", "plan", "go-ahead"]`. Move it to `resolve` at once, to `plan` when you start reading for the plans, and to `go-ahead` when you end the turn to wait. A single small issue or a text request, which need no go-ahead, skips that stage.
- **After the go-ahead** (or once the plan is shown, when none is needed), mark `plan` done and append with `progress_add_steps`:
  - One step per approved issue, in build order: `id` `i356`; `label` `#356` plus a word or two of its title (for a text request's items, `id` `t1` and `label` `T1` plus a word or two); `weight` 1 for a small change, 3 for anything larger, 5 for a schema change or a change across several areas; `stages` `["test", "build", "look", "commit"]`, without `look` when the issue changes no UI.
  - `id` `ready`, `label` `ready check`, `weight` 1, `stages` `["check", "fix"]`.
  - `id` `land`, `label` `push`, `weight` 1, `stages` `["push", "close"]`.
  - `id` `review`, `label` `review`, `weight` 2, `stages` `["round 1", "fix 1", "round 2"]`.
  - Mark an issue the owner dropped, or one you stop on, `skipped` or `blocked`.
- **Advance** with `progress_step` as the work moves: an issue's stages as you reach them, then `done` when it commits; `ready` through `check` and `fix`, then done.
- **At the report**, when the push is still waiting on the owner, leave `land` and `review` pending and set `progress_label` to `push needed`. Don't finish the run: the open bar is how the owner sees that the batch still needs its push.
- **Push** (at the owner's word, or before the report when the request already said to push): move `land` to `push` and `close`, then done. The review runs in another session, so mark `review` `skipped` and finish. If the owner asks for the review here instead, work `review` as below; when that comes before the push, leave `land` pending until the push.
- **Review:** clear the label (`progress_label` with an empty string), then move `review` to `round 1` when the review starts, `fix 1` when you fix its findings, `round 2` for the re-review, and done. A review with nothing to fix goes from `round 1` to done.
- **Finish** with `progress_finish done` once `land` and `review` are both done, or once the owner says they're finished (mark whichever of `land` and `review` is still pending `skipped` first). On a stop, mark the step in flight `blocked`, set `progress_label` to the reason in a few words, and call `progress_finish halted`.
- **New issues mid-run** (the owner adds one): mark the current `ready`, `land`, and `review` steps `skipped`, then `progress_add_steps` with the new issue followed by fresh `ready-2`, `land-2`, and `review-2`.
