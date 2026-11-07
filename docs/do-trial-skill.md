---
name: do
description: Works GitHub issues end to end in any repo, one at a time in this session - read, plan, pin the behaviour in tests, build, screenshot UI, update the docs, and commit each issue, with the run shown as a paceline progress bar. Takes one issue, a list, a range, "next N" to pick the N most important open issues from the board, or a plain-text request to work as if it were an issue, for example "/do 356", "/do 356 357 360", "/do 350-360", "/do next 10", or "/do add a CSV export to the reports page".
argument-hint: '<issue> [<issue> ...] | <first>-<last> | next [N] | <text request>'
disable-model-invocation: true
---

# Do: work GitHub issues

Work the issues in `$ARGUMENTS` on the integration branch, in this session, one at a time. Build in the main session: no builder agents, no reviewer agents, and no review skills unless the owner asks. Send wide code searches to Explore so file dumps stay out of context. Track each issue as a native Task (`TaskCreate`), marking it `in_progress` and `completed` as you go, and mirror the run on the progress bar (see **Progress bar**).

## 0. Learn the repo

Read the repo's `CLAUDE.md` or `AGENTS.md`, its `.claude/rules/`, and its manifest, to find the integration branch (usually `dev`), the commands for type checking, tests, and the full ready check (for example `pnpm ready`), the dev server and its port, where tests and docs live, and any UI verification recipe.

**The repo's own `/do` is its profile.** If `.claude/skills/do/SKILL.md` exists in the repo, read it now. This personal skill takes precedence over it, so it never loads on its own, but its repo specifics win over the general steps here: the docs to read, the guards and gates it lists, the schema workflow, the screenshot recipe (port, sign-in, headers, widths), the ready command, and the board's ranking rules. The run's shape, the progress bar, and the report stay as written here.

**Gates.** Check the repo's `.claude/settings.json` for hooks that gate `git commit` and the finish (a commit gate or Stop gate that runs the type check, related tests, and a test-integrity check):

- **Gates present:** rely on them. You don't run those checks by hand to prove anything.
- **No gates:** before each commit, run the type check and the tests that cover the files you changed, and confirm you deleted no test, added no `.only` or `.skip`, and removed no assertion.

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

1. **Check it isn't already tracked or done.** Search the board, open and closed (`gh issue list --state all --search "<key words>"`), and `git log <branch> --oneline` for the same work. If an open issue covers it, say so and work that issue in list mode, so it closes at push. If the work is already done, say where and stop.
2. **Write the brief.** Turn the text into an issue's shape: a title, the problem, what's in scope, testable acceptance criteria, what's out of scope, and open questions. Read the code it touches first, so the scope is grounded. Save it as `do-brief.md` in the scratchpad; that file is the issue body from now on, and the build is held to it. Don't widen the scope past the text.
3. **Split when it's several things.** If the text holds separate changes, make each one an item (`T1`, `T2`, and so on) in the brief, each with its own criteria and its own commit. One coherent change stays one item.
4. **Too vague to test is a question.** If you can't write acceptance criteria for an item, ask the owner rather than guessing.
5. **Don't file an issue** unless the owner says to (for example "file it" in the go-ahead). If they do, file it with `/newissue` from the brief before building, and from then on it's that issue.

In step 2, show the brief in place of the issue and always wait for the go-ahead, even for a small change: the brief is your restatement, and a misread scope is this mode's main failure. Commits carry no `Closes` or `Refs` line unless an issue was filed.

### Picking the next N

If the repo documents its own ranking (a roadmap or priority rule in `CLAUDE.md`, `.claude/rules/`, or the repo's `/do`), follow it. Otherwise read the board with `gh issue list --state open --limit 200 --json number,title,labels,milestone,body,createdAt`, then rank:

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

With one small issue, state the one-line plan and start building (a text request always waits; see **Working a text request**). Otherwise put every plan in one message, in build order. Note where two issues touch the same code, and ask any question only the owner can answer. Then end your turn and wait. The owner approves, edits, or drops items, and that one go-ahead covers the whole list.

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
6. **Commit** through `commit-commands:commit`, one commit per issue, with only that issue's files:
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

Then list the dropped numbers and why. Say that no review has run on this work yet and name the review to run: `/deep-review` when the repo has `.claude/skills/deep-review/`, otherwise `/orc-review` or `/deep-review-generic`. Say the commits aren't pushed, and ask whether to review, push, or both. If this run started the dev server, stop it and confirm its port is free.

## When the owner asks for a review

This covers "review", and the owner running `/deep-review`, `/orc-review`, or `/deep-review-generic` right after this run. Run the review over the range this run committed. Fix every confirmed Blocker and Warning in the main session, commit the fixes (a subject that names the change, never the review), and re-review the fixes once. Report what the review found, what you fixed, and what's still open.

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

When the paceline `progress_*` tools are available, mirror the run as a status-line bar. Without them, skip this section silently and never install, mention, or ask about them. If they are deferred, load all five (`progress_start`, `progress_step`, `progress_add_steps`, `progress_label`, `progress_finish`) in one tool search during step 1. Send each call in the same message as a tool call you are already making; the tool search is the only bar call that may stand alone. If a call fails, drop the bar and carry on.

Paceline only appends steps and never reshapes one, so start small and add the rest once the plan is approved.

- **Start** in step 1, once `$ARGUMENTS` parses: one `progress_start` named `do` (`do #356` for a single issue, `do: <short title>` for a text request), with one step: `id` `plan`, `label` `plan`, `weight` 1, `stages` `["resolve", "plan", "go-ahead"]`. Move it to `resolve` at once, to `plan` when you start reading for the plans, and to `go-ahead` when you end the turn to wait. A single small issue that needs no go-ahead skips that stage.
- **After the go-ahead**, mark `plan` done and append with `progress_add_steps`:
  - One step per approved issue, in build order: `id` `i356`; `label` `#356` plus a word or two of its title (for a text request's items, `id` `t1` and `label` `T1` plus a word or two); `weight` 1 for a small change, 3 for anything larger, 5 for a schema change or a change across several areas; `stages` `["test", "build", "look", "commit"]`, without `look` when the issue changes no UI.
  - `id` `ready`, `label` `ready check`, `weight` 1, `stages` `["check", "fix"]`.
  - `id` `review`, `label` `review`, `weight` 2, `stages` `["round 1", "fix 1", "round 2"]`.
  - `id` `land`, `label` `push`, `weight` 1, `stages` `["push", "close"]`.
  - Mark an issue the owner dropped, or one you stop on, `skipped` or `blocked`.
- **Advance** with `progress_step` as the work moves: an issue's stages as you reach them, then `done` when it commits; `ready` through `check` and `fix`, then done.
- **At the report**, if no review has run, leave `review` and `land` pending and set `progress_label` to `review needed`. Don't finish the run: the open bar is how the owner sees that the batch still needs its review.
- **Review:** clear the label (`progress_label` with an empty string), then move `review` to `round 1` when the review starts, `fix 1` when you fix its findings, `round 2` for the re-review, and done. A review with nothing to fix goes from `round 1` to done.
- **Push:** move `land` to `push` and `close`, then done. If the owner pushes without a review, mark `review` `skipped` first.
- **Finish** with `progress_finish done` once `land` is done, or once the owner says they're finished without pushing (mark `review` and `land` `skipped` first). On a stop, mark the step in flight `blocked`, set `progress_label` to the reason in a few words, and call `progress_finish halted`.
- **New issues mid-run** (the owner adds one): mark the current `ready`, `review`, and `land` steps `skipped`, then `progress_add_steps` with the new issue followed by fresh `ready-2`, `review-2`, and `land-2`.
