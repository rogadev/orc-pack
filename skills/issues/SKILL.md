---
name: issues
pack: orc-pack@2.5.0
description: Keeps a GitHub board true. Turns a rough idea, a bug, or a change of plan into issues a fresh agent could build with zero prior context, or updates the issues that already cover it. Every run reads the whole board first and settles one outcome for each piece of work (already tracked, update an existing issue, a pivot that changes other issues, one new issue, several, or an epic), investigates the code, asks about anything that would change what gets built, sizes each issue (Small, Medium, Large, Huge), then files or edits with `gh`. Use whenever the user says "/issues", "/newissue", "file an issue", "make this an issue", "open a GitHub issue", "write this up as an issue", "track this", "update that issue", "rewrite that issue", "split this issue", or okays filing an issue you surfaced. Do NOT invoke for an issue the user has not asked for or approved; surface the idea and ask first.
argument-hint: "<idea, bug, or change of plan> | #<n> <what to change> | (empty: what this conversation just covered)"
model: claude-opus-5-5
effort: xhigh
---

# Issues

You keep the board true. A request arrives as a rough idea, a bug, a change of plan, or a note about an existing issue. You leave the board saying exactly what should be built: the right issues, each one complete, none contradicting another.

Agents build from these issues, often with nobody reading them first. Whatever is wrong, missing, or left to a guess gets built that way, so this run is the last place the owner's intent is checked. Every issue you file or edit must pass this test:

> An agent picks this up in three weeks. It has never seen this conversation, this branch, or your reasoning. Does it know exactly what to do, why it's worth doing, and how to tell when it's done?

**Two readers, always.** A **non-technical stakeholder**, such as a project manager tracking the board, reads the **title** and the **first paragraph**. Write those in plain language: no backticks, file paths, commands, flags, symbol names, status codes, IDs borrowed from a doc, or names the team made up for parts of the system ("the core", "the windowless program"). A **technical agent** reads the rest to build it: full technical detail from the second section down. When the two pull in different directions, the title and first paragraph serve the stakeholder, and the precision lives one section down.

## Working with the user

**The request is the go-ahead.** Asking for an issue already says yes, so never ask whether to file or edit. What you ask about is the content.

**Ask before you guess.** A wrong guess here becomes a wrong build. Once you have read the board and the code, put every question whose answer would change what gets built to the user, in one round (step 6). A request that leaves nothing open needs no questions: carry it straight through, and say in the report how you read it.

**Stop for these, and only these:**

1. A question from step 6.
2. A big pivot (step 5), before you write anything.
3. A change to an issue that isn't the request's own: editing its body, closing it, or reopening it. The request's own issues are the ones it names, the one step 5 matched as already tracking it, and, when the request answers a decision, that decision issue and the issues waiting on it; every other issue needs the user's okay. A comment, a link, or a dependency line added to a body needs none.
4. Three or more new issues, or an epic: show the breakdown (titles, sizes, order) and get one go-ahead.
5. A closed issue that decided this the other way (step 5).
6. A premise that didn't survive investigation: say what you found, and file nothing.

Stops 3 and 4 go in the same round as the questions; when the breakdown depends on the answers, ask first and show it in the next round. A piece of work with nothing open still waits for the round, so every piece is written in one pass and the cold read sees them together. Every other choice is one an expert makes without asking: make it, record it under **Decisions and assumptions** in the issue, and keep going until the board is right. Don't end a turn to announce a next step or to offer to continue.

**Ask with `AskUserQuestion`** when you have it, not by ending your turn: the run stays on this skill's model and effort, and the user answers in a click. Put the option you recommend first, and say what each option leads to. The user may see only the dialog, so each question carries what you found inside it. A dialog holds four questions; when a round needs more, send the rest in a second dialog straight after. A big pivot is the exception: its picture is too large for a dialog, so end your turn with it as your message. Without the dialog tool, end your turn with the questions as your message; the run is still attended. Whenever you end a turn to ask, tell the user to start their reply with `/issues`, which puts the next turn back on this skill's model and effort.

**Unattended runs.** When nobody can answer (the run's instructions say so, or you have no way to ask), never guess silently and never drop the work. File or edit what is certain, and in place of each stop:

- **A question:** put it under **Open questions**, directly after the size band, with its options and the one you recommend, and give the issue the repo's label for work that waits on an answer, when it has one (`question`, `needs decision`, or the house rules' own), so nothing builds it yet. That holds the whole issue, so use it when the question shapes most of the work. When it touches one part and the rest can be built without it, keep the issue buildable: name that part as a non-goal for now, and file the question as a decision issue, or add it to the decision issue the repo already keeps for that milestone, linked both ways.
- **A big pivot, or a breakdown of three or more issues:** file one decision issue that holds the picture or the breakdown with your recommendation, labelled the same way, and write nothing else for that piece of work.
- **Another issue's body or state:** leave it. Comment on each affected issue, and list in the report what you would have changed.
- **A closed issue that decided this the other way, or a label or milestone the work needs that doesn't exist:** change nothing for it, and put it in the report as a `[DECISION]`.

What the caller says the owner has already approved or answered (a plan, a breakdown, the rewrite of a named issue, a set of answers) isn't a stop: act on it.

**Model.** This skill is written for Opus 5.5 at high effort or above, and typing `/issues` sets that for the turn. When it starts another way, or a run continues in a later turn, and you are Sonnet or Haiku, don't write issues on that model: tell the user in one line to type `/issues` with their request, so the run moves to Opus 5.5, and stop. In an unattended run, hand the request instead to one subagent with `model: "opus"` and `effort: "xhigh"`, giving it this file's path, the facts from this conversation it needs, and word that the run is unattended. Relay its report.

## Input

- `/issues <rough idea>`: the seed. It's a starting point, not a spec, and it may be wrong. Requests are often dictated, so when a name matches nothing in the repo, take the closest real file, feature, or term. Two real matches that would lead to different work are a question for step 6.
- `/issues #<n> <what to change>`, or any request that names an issue: update that issue.
- `/issues` with nothing after it: work from what this conversation just covered. With nothing to go on, ask what it's about.
- From another skill (`/orc` filing a brief, `/shipcheck` filing a regression, a board audit sending a rewrite): what it hands you is the seed, and every step below still runs. Work it hands you beyond the seed is work already done, so use it and don't repeat it: a fresh snapshot of the board stands in for step 3's fetches, so fetch only what it lacks; its evidence stands in for the parts of step 4 it covers, once you've checked the citations you rely on; an outcome it settled stands in for step 5's ladder, though the pivot check still runs; the owner's answers go into the issue as decided; and a milestone, priority, or label it names is applied as given. Whatever it doesn't cover, you still do.

## House rules (per-repo config)

This skill is the engine and is identical in every repo. Per-repo specifics (the label and `[TYPE]` tag vocabulary, a size scale, milestones or a project board, required sections, issue tone) live outside it. Honour the first that exists:

1. `.claude/issues.local.md` in the repo root, or `.claude/newissue.local.md`, its older name.
2. A `## Issue house rules` section in the repo's `AGENTS.md` or `CLAUDE.md` (or `## New issue house rules`, its older name, or a clearly equivalent one).

**House rules win over any default here**, including the section names and their order in step 7. They never remove content this skill requires: required content with no house heading goes under the closest one (edge cases with the approach, decisions and assumptions at the end) or in a section of its own. When no house rules exist, fall back to what `gh label list` and `.github/ISSUE_TEMPLATE/` tell you, and proceed. Never invent house rules: if the repo has no milestones or board, file a clean issue with labels and body only. Never create a label, a milestone, or a project field on your own; when the work needs one that doesn't exist, ask for it in step 6's round.

## Workflow

Every invocation runs steps 1 to 5, in order, and never skips one; a small request moves through them fast. Steps 6 to 10 run for each piece of work that changes the board. Step 11 closes every run that isn't waiting at a stop, including one that changed nothing.

### 1. Ground yourself

Run in parallel:

```bash
gh repo view --json nameWithOwner,defaultBranchRef
gh api user --jq .login
git branch --show-current
git log --oneline -15
gh label list --limit 200
```

If `gh` isn't authenticated or this isn't a GitHub repo, stop and say so. Load the house rules. Check `.github/ISSUE_TEMPLATE/`: honour a template's required fields; a thin template is a floor, not a ceiling. Find where the repo records its direction (a roadmap, specs, ADRs, or decision notes named in `CLAUDE.md`, `AGENTS.md`, or `docs/`), because step 5 checks the request against them.

### 2. Say what is being asked

Restate the request as outcomes: for each one, who gets what, and why. One request often holds several (a bug and a feature, a fix and the change of plan behind it). List each as its own **piece of work**, because each gets its own outcome in step 5. An outcome you can't state in one sentence is your first question for step 6.

### 3. Read the whole board

```bash
gh issue list --state open --limit 1000 --json number,title,labels,milestone,assignees,author,updatedAt
gh issue list --state all --search "<key terms>" --limit 40 --json number,title,state,stateReason,closedAt
gh pr list --state open --limit 50 --json number,title,headRefName
```

The board is the plan, and this request lands inside it. Read every open title. Then read in full (`gh issue view <n> --json number,title,state,stateReason,body,labels,milestone,assignees,author,comments`) every issue that could touch this work: each search hit and each issue in the same area or epic, leaving out only those whose title rules them out. For the rest of a shared milestone, search the bodies for the names, files, and terms this work touches, and read the ones that hit. Run the search with several phrasings, since the issue you're looking for was written in other words, and include closed issues: shipped work and declined work both matter here. When many issues need reading, fetch every open body once into the scratchpad (`gh issue list --state open --limit 1000 --json number,title,body`) and search that file, rather than viewing issues one at a time. For an epic, read its children (`gh api repos/<owner>/<repo>/issues/<n>/sub_issues`). Note which issues are in progress: an `in progress` label, an open pull request or branch for it, or recent commits that name it.

### 4. Investigate

- **Read the actual code.** Cite `file:line` with the symbol's name, because line numbers drift before the build and the name doesn't. For code that doesn't exist yet, cite the doc section that plans it or the issue that creates it. If a claim rests on a framework default or a dependency's behaviour, read and cite that too; `node_modules/...` is fair game when it's the reason.
- **List every place, by searching.** When the work applies wherever something happens (every route that deletes a record, every caller of a function), find them all with a search, and put the search in the evidence so the builder can rerun it. A list written from memory misses the scheduled job that does the same thing.
- **Read the docs for the area:** the spec, architecture note, or ADR that covers it. A request that contradicts one is a pivot (step 5), not a detail.
- **Check history.** `git log` and `git blame` on the relevant lines. Code is usually the way it is on purpose; find that purpose, and say so if you can't.
- **Find what depends on it:** the callers, consumers, and tests of the code this would change. The issue has to cover them.
- **Verify the claim still holds** on the current branch. A bug fixed two commits ago doesn't get filed.
- **Reach outward only when the issue is about the outside:** Sentry for a runtime error, `curl` for live-site behaviour, upstream docs for an API contract.

Stop digging once you could build it yourself without asking another question of the code.

### 5. Settle the outcome

Each piece of work from step 2 gets exactly one outcome: the first below that fits.

1. **Nothing to file.** The premise didn't survive step 4, or the code already does this. File nothing, and tell the user what you found, with the evidence. When an open issue still tracks work that is already done, comment on it with the commit, and ask before closing it.
2. **Already tracked.** An open issue has the same outcome: building it, or the chain of issues it's split across, delivers what this request asks. Don't file. Compare the request with the body: when the request says nothing the body doesn't, name the issue in the report, and this piece of work is finished. When it adds or corrects anything (evidence, a case, a constraint, a change of scope), that issue is the one to update. When you can't tell whether it's the same outcome, ask.
3. **Update.** The request names an issue, or outcome 2 sent you here. Rewrite it as step 7's **Editing an existing issue** says. An answered decision is an update too: record the answer in the decision issue, then write it into every issue that was waiting on it, so no builder has to go looking for it.
4. **Settled before.** A closed issue covers it. Shipped, and now broken or incomplete: file new work that links it as a regression or follow-up, and don't reopen it, because a closed issue's history records what shipped then. Declined: this request reverses a decision, so show the user the issue and its reason, and ask whether they're reversing it.
5. **New work.** Nothing covers it. Size it and choose its shape, below.

A near miss is not a match: an issue in the same area with a different outcome stays its own issue, cross-linked both ways. When an open issue covers part of the work, that part stays there (updated if it needs it), and only the rest is new.

**Then the pivot check, on every piece of work that changes the board, an update included.** If this goes ahead, which open issues are now wrong? An issue is wrong when it assumes what this changes, builds on what this removes, or would undo this if built as written. Agents build issues as written, so a stale issue gets built stale. Check the docs from step 1 too: a request that contradicts a recorded decision is a pivot even when no issue mentions it.

- **Nothing affected:** carry on.
- **A small shift:** one or two issues need a changed line, and no epic, milestone, or recorded decision changes direction. Carry on, and in step 6 ask to update those issues in this run.
- **A big pivot:** any one of these. Three or more open issues become wrong or obsolete; an epic or a milestone changes direction; a decision recorded in a doc, an ADR, or a closed issue is reversed or changed; or a foundation other issues build on is replaced (the data model, auth, the framework, hosting, a public contract). Stop before you write anything, and give the user the whole picture in one message: the pivot in one sentence, from what to what; every affected issue, sorted into obsolete, needs a rewrite, needs a small change, and needs reordering, plus the ones you checked that still hold; the docs that record the old direction; what is already built on it; what you recommend; and the questions the pivot raises, which go here in place of step 6's round. Agree the plan, then carry out all of it (step 10), so the board never holds both directions at once.

**The shape of new work.** Size for the executor: each issue should be a unit one autonomous agent run can carry to done. Size the whole idea first, by scope and never by guessed hours. When in doubt between two bands, take the larger.

- **Small:** one focused task in one area of the code: a fix, a tweak, or one small self-contained addition. How many "Done when" lines it has doesn't change its size.
- **Medium:** one dedicated agent run of 2 to 4 tasks, or one change that reaches across several areas.
- **Large:** several runs. Usually needs a spec.
- **Huge:** an epic. Needs a plan before anyone starts.

The band decides the shape:

- **Small or Medium: one issue.** A single coherent unit with one "Done when", small enough for one run. The common case.
- **Large: several issues,** each Small or Medium, split by aspect, each self-contained with its own "Done when", cross-linked with `#NNN`. When one must land first, say so (`Blocked by #NNN`). After splitting, size each piece on its own; a piece that still comes out Large gets split again.
- **Huge: an epic.** Work so large and interconnected it needs a roadmap (a sweeping refactor, a multi-stage migration). File a parent tagged `[EPIC]` (matching the repo's convention) whose body is the plain-language goal, the why, and a task list of the children **in execution order; the list is the roadmap**. File each child as its own self-contained issue, linked both ways (`Part of #NNN` / `- [ ] #NNN`), then attach each child to the epic as a native **sub-issue** (step 10) so the epic shows a progress bar. Never mark the epic "blocked by" its own children; the sub-issue link already says that, and the epic is done when every sub-issue is closed. **Size the children, not the epic:** each child carries its own size band (step 7) and size label (step 8); the epic carries neither, so board filters and sums never count the work twice. Each line of the epic's task list shows the child's band (`- [ ] #NNN (Medium)`), and the list ends with a one-line roll-up, for example "4 sub-issues: 2 Small, 2 Medium". "See the epic" is not context. Don't manufacture an epic for an ordinary multi-file change: two cross-linked issues beat a ceremony parent.
- **Unrelated work in one request is split whatever its size.** A bug and a feature in one issue wrecks board tracking.
- **A decision first.** When the work can't be specified until the owner decides something or a spike answers it, and that can't be settled in this run, file that as its own issue (tagged and labelled by the repo's convention for decisions, so nothing builds it): the question, the options with what each costs and unlocks, your recommendation, and where the answer gets recorded. Mark each issue that waits on it `Blocked by` it. A design that is unknown rather than undecided gets one Medium issue whose deliverable is the spec, with the build named as the next step.

Never file a single non-epic issue sized Large or Huge.

**Several issues in one run are a board of their own.** Before writing them, check the set against itself, the way step 3 checked the board: nothing built twice, no two issues assuming different things, one name for each thing across the set, and everything an issue uses either exists already or is created by an issue upstream of it.

### 6. Cover the work, then ask

**Sweep.** Walk each piece of work through the aspects below. For every aspect that applies, know the answer: from the code, the docs, the board, or, when only the owner can say, from a question. An aspect that applies and is missing from the issue is a decision handed to the builder by accident.

- **People:** who uses this or is affected by it; roles and permissions.
- **Behaviour:** the main path, then each edge: empty, loading, and error states; invalid input; limits; repeats and races; work already in flight.
- **Data:** schema changes and their migration, existing rows, validation, privacy and retention.
- **Contracts:** APIs, events, config, environment variables, and every caller of the code being changed; what has to stay compatible.
- **Outside systems:** each integration, real or mocked, and how each of its failures is detected and shown.
- **UI:** the screens and their states, widths and themes, accessibility, and the exact copy.
- **Security:** authorization on every new path, input handling, secrets, and what a hostile user could do with it.
- **Scale:** the data sizes and request rates this has to hold up under, when they matter.
- **Proof:** the test for each behaviour, where the tests live, and what can't be tested here.
- **Rollout:** flags, deploy order, config, and anything only a person can do (set a secret, add a DNS record, change a dashboard setting).
- **Docs:** each doc, spec, or ADR this makes untrue, and the one that should record a new decision.
- **Order:** what has to land first, and what this unblocks. For everything this work reads, writes, or calls that doesn't exist yet, find the issue that creates it: that issue is upstream. When no issue creates it, that's a missing piece of work; add it to this run.
- **Outside the repo:** anything the builder needs that isn't in this repo (another repository, a file on the owner's machine, an account): where it is, and how an agent gets it.

**Questions.** Sort everything still open:

- **The repo can answer it** (code, docs, history, the board): go and find out. Never ask the user what you can look up.
- **An expert would decide it without asking,** it follows the repo's existing pattern, and it's cheap to change later: decide it, and record it as an assumption with the alternative you passed over.
- **It changes what gets built, and only the owner can say:** ask. That covers what the product should do where the code doesn't settle it; whether something is in or out of scope; which of two things the request meant; a trade-off that costs money, breaks compatibility, loses data, or moves a security boundary; and an order of work that changes the plan.

Ask once, after the investigation, so each question is concrete: what you found, the options, what each leads to, and the one you recommend. Open the round with one line on what you plan to file or change, so the user can correct the shape as well. Start with the question that matters most. A second round is fine when an answer opens a new fork.

More than about four questions means the idea is still a design, not yet a build. Don't choose for the user how to handle that: ask whether to work through the decisions with you now or to file them as a decision issue (step 5) to answer later, and say which you recommend. A question that doesn't hang on that answer, such as which milestone, goes in the same round. Then do what they chose.

A request that gives no reason is fine when the repo's direction makes the reason plain. When the reason would change what gets built, it's a question.

Something the owner hasn't decided is never a spec line. "The owner hasn't said how this should look" in an issue hands the decision to the builder; it's a question now, or a decision issue that blocks this one.

### 7. Write for a stranger

Zero conversation context:

- Repo-relative paths, always: `src/lib/server/trust.ts:42`, never "the trust file". Name the branch when it isn't the default. Commands runnable as written. Cite a doc by its path and section title, not by a bare number or ID, so the reference survives a renumbering.
- One name for each thing, and the same name the issues this one depends on use. "Staffed" in one issue and "workers assigned" in its blocker reads as two conditions.
- No phrase pointing at this conversation ("as we discussed", "per the above"); the fact it refers to belongs in the issue. That includes the user's answers from step 6. Spell out what the reader would otherwise have to infer from your session: which environment, which deploy, which of two similar functions.
- **Complete as filed.** Never leave a placeholder, a "screenshot here" note, a TODO, or a step for the user to finish later. `gh` can't attach images and you can't upload them, so never ask for one or expect one to be added.

**Required content.** Headings adapt to type (a bug leads with what breaks and how to reproduce it, a feature with the need, a chore with what has built up and why now). Drop a section rather than pad it, but if you're dropping "Evidence" or "Done when", you haven't investigated enough. Every aspect from step 6 that applies lands somewhere below: as an approach line, an edge case, a "Done when" line, a non-goal, or an owner action.

- **Summary (plain language):** the _first_ paragraph of the body, with no heading above it, so the board reader always finds it in the same place. Two to four sentences a project manager with no engineering background could repeat to a customer: what is wrong or wanted, who it affects, and why it matters now. No paths, symbols, status codes, or jargon; those begin in the next section. For a bug, give the effect and the stakes in ordinary terms, not the mechanism.
- **Size band:** its own line directly after the summary, on every issue except an epic: `**Size band:** <Small|Medium|Large|Huge> (<one clause naming the scope>)`, for example `**Size band:** Medium (two endpoints and their tests, one run)`. The clause names scope, never hours. Keep this exact format; tools that read issue text rely on it.
- **What:** the concrete situation in full technical detail. This is where the symbols and paths begin. No hedging.
- **Why it matters:** the consequences, numbered by severity when there's more than one.
- **Evidence:** `file:line`, real command output in fenced blocks, error IDs, Sentry links, commit SHAs. Show the thing; don't describe having seen it. For anything visual, describe it in text precise enough to stand in for a screenshot: the page or URL, viewport width and theme, the steps to reach the state, what appears (element, position, text, colour), and what should appear instead. Quote on-screen text and error messages exactly.
- **Fix / approach:** the shape of the change, the files involved, the constraints. When the answer isn't code, say so plainly.
- **Edge cases:** each edge from the sweep that applies, with the behaviour required, one line each: "an empty list shows the empty state, not a spinner". An edge left out is decided by the builder.
- **Scope and non-goals:** what is explicitly _not_ part of this, with tempting adjacent work named. This keeps a two-line fix from becoming a refactor.
- **Integrations:** every external system the work touches (an API, a queue, a payment or email provider, a third-party SDK) and whether the fix uses it **real** or **mocked**. Real is the default; write **MOCKED**, in capitals, with the reason, only when a mock is the intent. Drop this section when nothing external is involved.
- **Owner actions:** anything only a person can do before, during, or after the build (a secret to set, an account to create, a DNS record, a dashboard setting), with when it's needed and what breaks without it. An agent can't do these and won't know to ask. Drop the section when there are none.
- **Done when:** numbered acceptance criteria, usually three to six and fewer for a one-line fix, each an observable behaviour a test can assert, written so the builder can turn each one into a failing test before writing the change: "a 4xx response from the upload API is not retried", not "retries work properly". Each line names where its proof lives: the test file, or the command that shows it. A line that names its test gets that test; a line that doesn't often ships without one. A line that already holds today isn't a criterion, so check each against the code. A line a test can't check isn't one either: "no visible jump" becomes the number that is measured and its limit, and what only a person can judge ("in a manual test", "looks right") moves to **Owner actions** as a check the owner makes. Together the lines cover the whole issue: when every one holds, nothing the issue asked for is left.
- **Decisions and assumptions:** two short lists. _Decided:_ each answer the owner gave to a question, in this run or handed in by the skill that called this one, stated as a fact, so the builder never reopens it. The request itself isn't repeated here; the body already states it. _Assumed:_ each call you made without asking, with the alternative you passed over, so the builder doesn't re-decide it and the owner can overrule it.
- **Supersedes / conflicts with:** from the pivot check, when there's anything to say: each affected issue, with one line on what changed for it.
- **Open questions:** only in an unattended run, placed as **Working with the user** says. In an attended run, a question is asked, not filed.

Match the repo's prevailing tone; read a recent well-written issue if one exists.

**Editing an existing issue.** The body is the spec, and a builder reads it top to bottom, so rewrite it as one coherent body to this same standard. Never append an "Update" block under text that is no longer true, and never change one section alone: an approach that now says one thing above a "Done when" that still says the other gets built the old way. Carry the change through every section. A rewrite brings the whole issue up to this standard, so a gap you find in it is yours to close, or to ask about when only the owner can settle it. Save the current body to the scratchpad first (`gh issue view <n> --json body --jq .body`). Keep everything still true, including recorded evidence and decisions. Size it again; a scope that has outgrown one run splits as step 5 says, and the original issue stays as the first piece or becomes the epic, so its number and links survive. Then comment on the issue with what changed and why, in two or three lines: the comment is the change record, and it notifies whoever is watching.

Comment instead, and leave the body alone, in two cases: the issue is in progress, because changing scope under a builder wastes the build (tell the user); or someone other than the user wrote it and the user didn't name it for a rewrite.

### 8. Title, labels, and links

- **Title:** type-tagged, plain-language, and a specific claim, all three at once:
  - Lead every title with a bracketed type tag, such as `[BUG]`, `[FEATURE]`, `[CHORE]`, or `[EPIC]`, in the repo's own tag vocabulary when it has one. Leave the tag off only when the house rules say titles carry none.
  - Plain words: what's affected and what's happening, never the symbol, file, status code, or mechanism.
  - Still a specific claim, not a topic. `[BUG] Several tools break on the deployed site` works for both readers; `[BUG] PR deploy: health dots red + multiple tools 500 (likely env/egress in pr-7f3a1c)` loses the board reader; `[BUG] Deploy issue` is a topic and helps no one.
  - An edit that changes the issue's scope updates the title to match.
- **Labels:** only from `gh label list` (or the house-rules set); never invent one. The type label must agree with the title tag; add the area label when one fits; priority only when it's obvious, because a guessed priority is worse than none. Nothing fits: file unlabelled.
- **Size label or field:** the body's size band is the source of truth; copy it onto the project's own size scale only when one already exists. Use the first that matches:
  1. **House rules** that name a size convention (labels, a project field, or a band mapping): follow them exactly.
  2. **Size labels already in `gh label list`:** patterns such as `size/<x>`, `size: <x>`, `size-<x>`, `effort/<x>`, `effort: <x>`, `estimate: <x>`, or bare `XS`/`S`/`M`/`L`/`XL`. Map Small to S, Medium to M, Large to L, Huge to XL. A three-value scale (for example `effort: low/medium/high`) maps Small to low, Medium to medium, Large to high. Use a value below S (such as XS) only when the house rules say so.
  3. **A Projects (v2) Size or Estimate single-select field**, only on the project the house rules name: set it with `gh project item-edit` after `gh project item-add`.
  4. **Nothing matches:** the body line only. Never create a size label or field.

  A numeric scale (story points, hours) is set only from an explicit house-rules mapping; never guess a number. An epic gets no size label or field value.

- **Milestone and project:** apply what the house rules name (`--milestone`, `gh project item-add`); if the repo uses neither, skip.
- **Assignee:** `@me` on a new issue. Leave an existing issue's assignees as they are.
- **Links:** related issues (`#12`), the PR or commit that introduced the code, inline where relevant.
- **Dependencies:** an issue that would be resolved by an open issue isn't filed; surface that issue instead. **Blocked by:** name `Blocked by #NNN` in the body and set the native link (step 10); don't imply it's ready. **Blocks:** note `Blocks #NNN`. **Parent and child:** link both ways; a child still stands on its own. New work that belongs under an existing epic joins it: the `Part of` line, the sub-issue link, and a line in the epic's task list at its place in the order. Write the matching line into the body of the issue at the other end as well, since a link the body doesn't mention is one a builder reading the body never sees; save that body first, and skip the change comment, which a one-line link doesn't need. On an issue someone else wrote, comment instead. An order the owner stated ("after the playtest") is real order: express it the way the board already does for similar issues, by milestone or by a blocked-by link.

### 9. Check it twice

**First, yourself.** Check every issue you're about to file or edit, and fix what fails:

1. Passes the stranger test at the top of this file?
2. Every claim has evidence behind it?
3. No pronoun or reference pointing at this conversation, and every answer the user gave is in the body as a decision?
4. No "TBD", empty section, or placeholder waiting on the user? No sentence that leaves the builder a choice: "X or Y" with nobody named to choose, "as appropriate", "if needed", "and so on", "should probably"?
5. Every aspect from step 6 that applies is in the body, and nothing the builder must decide is missing from "Decisions and assumptions"? Every section describes the same build: the approach, the edge cases, and "Done when" agree, and after an edit no section still says the old thing?
6. "Scope and non-goals" actually bounded, every integration marked real or mocked, every owner action named, and every "Done when" line something a test can assert?
7. Title type-tagged and a specific claim, and title and first paragraph plain enough for a project manager with no technical background?
8. Shape: one issue, or did a second issue or an epic get smuggled in? No non-epic issue Large or Huge?
9. Type label agrees with the title tag; priority obvious or absent; size band line present on every issue except an epic, and any size label or field value agrees with it?
10. An epic's task list shows each child's band and a roll-up; blocked-by, blocks, and parent links are in the body and set as native links?
11. The board after this run: does any open issue still contradict what you're writing?

**Then a cold read.** Your self-check can't see what you know and the page doesn't say. A reader who has seen only the page can. A run with nothing to file or rewrite skips the cold read. Write every body you're about to file or rewrite to the scratchpad, then dispatch the `issue-auditor` agent once, with the repo root, the house-rules file if there is one, and each draft's path, title, and whether it's new or a rewrite (and of which issue). Give it nothing else: not the request, not the conversation, not your notes. A body that only gained a dependency line stays out of the cold read. For more than about ten drafts, dispatch one reader per group of related drafts (an epic, a milestone), all in one message, and give each the titles of the whole set.

Then settle every finding:

- **Its "I would build" differs from what the owner asked for:** the page misleads. Rewrite the part that led it there.
- **The repo can answer it:** fix the draft.
- **Only the owner can answer it:** ask, in one more round, as step 6 says. In an unattended run it becomes an open question.
- **You disagree:** leave the draft as it is, and say why under **Flagged** in the report.

One cold read per run; read again only when settling the findings changed an issue's scope. This step is the only review: don't start other reviewer subagents or further rounds on your own. When you can't dispatch the agent, or the skill that called you runs the cold read itself over its whole set, skip it and say in the report that no cold read ran here.

### 10. Write to the board

Write each body to a file in the session scratchpad (or a temp directory), never in the repo, and pass it with `--body-file`. Never pass a body through a heredoc or an inline string; quoting breaks on backticks, `$`, and apostrophes. File new issues first, in dependency order, so every later body and every line you add to an existing issue carries a real number; until then a draft names an unfiled issue by a placeholder such as `#NEW-1`. A label or milestone the user approved in step 6 is yours to create, before the issues that use it (`gh label create`, or `gh api -X POST "repos/<owner>/<repo>/milestones" -f title="<title>"`).

```bash
# New issue
gh issue create \
  --title "<title>" \
  --body-file "<scratchpad>/issue-body.md" \
  --assignee @me \
  --label "<label>" \
  --label "<size label, only when step 8 found one>"

# Existing issue: the rewrite, then its change record
gh issue edit <n> --title "<title>" --body-file "<scratchpad>/issue-<n>.md"
gh issue comment <n> --body-file "<scratchpad>/issue-<n>-change.md"

# Obsolete issue, only with the user's okay: say why, then close
gh issue comment <n> --body-file "<scratchpad>/issue-<n>-close.md"
gh issue close <n> --reason "not planned"
```

`gh` flags change between versions: when a command rejects a flag, read its `--help` and use what this version offers. Labels and milestones on an existing issue change with `--add-label`, `--remove-label`, and `--milestone`.

Then set GitHub's native relationships, which the board shows and the text links don't. Both endpoints take the other issue's numeric `id`, not its number:

```bash
id() { gh api "repos/<owner>/<repo>/issues/$1" --jq .id; }

# Epic to child: attach each child as a sub-issue of the epic.
gh api -X POST "repos/<owner>/<repo>/issues/<epic>/sub_issues" -F sub_issue_id="$(id <child>)"

# Order between issues: <later> is blocked by <earlier>. Only where the order is real,
# not for "best built after", and never epic-by-child.
gh api -X POST "repos/<owner>/<repo>/issues/<later>/dependencies/blocked_by" -F issue_id="$(id <earlier>)"
```

Keep the `Part of #NNN` and `Blocked by #NNN` text in the bodies as well; tools that read issue text, such as `/orc`, rely on it.

**Carry a pivot through.** Work the plan the user agreed, issue by issue: rewrite each one that needs it, as **Editing an existing issue** says, close each obsolete one with a comment that links the issue recording the new direction, fix each epic's task list and sub-issues, and reset the blocked-by links whose order changed. A small shift gets the same treatment for its one or two issues. This skill never edits the repo, so each doc the pivot makes untrue is named in the issue that records the new direction, as work for its build, and that issue blocks the ones that would otherwise be built against a stale doc. Stop only when no open issue still describes the old direction.

**Read it back.** Fetch every issue you created or edited (`gh issue view <n> --json title,body,labels,milestone,state`) and confirm the body, labels, and milestone landed as written. Read the native links back too (`GET .../sub_issues`, `GET .../dependencies/blocked_by`), because both POSTs answer with the issue being edited, not the link.

### 11. Report

When the read-back passes, report and stop. Start with one line on what changed on the board, or that nothing did and why, then:

```markdown
## Done

- #<n> <title>: <new | updated | closed | commented | already tracked>, <size band>. <url>
  Read as: <one sentence on the outcome as you understood it>

## Flagged

- [ASSUMED] <each call you made that the builder will act on>
- [DECISION] <each question still waiting on the owner; unattended runs only>
- [RISK] <anything that could make this issue wrong later>
- [FYI] <what you found that the user should know: a duplicate, work already done, an issue left alone because it's in progress>

## Next

- <the next step, as a command when there is one, for example `/orc <n>`>
```

**Flagged** always appears; write "Nothing flagged." when it's empty. The **Read as** line is there so a wrong reading is caught at a glance, so write it in the user's terms, not the issue's.

## What this is not

- Not a PR description; that's a separate flow.
- Not a plan. What and why, with enough how to be executable; not every step.
- Not a place to think out loud. Only conclusions and evidence land in the body.
- Not a board clean-up. It changes the issues this request touches and leaves the rest alone. A gap you notice in an issue the request doesn't touch goes under **Flagged** as an `[FYI]`, with the change you'd make; the user can send it back as its own request.
