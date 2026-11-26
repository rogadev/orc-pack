# Triage report template

Write `$D/report.md` in this shape. Drop a section that has nothing in it, except **Change plan** and **Decisions for you**, which say "None" when empty. Two readers use it: the owner (and perhaps a project manager) reads the summary, the project section, the milestones, and the build order; the owner approves the change plan item by item. Keep the top half free of paths and symbols; evidence lives in the change plan and the map.

Give every change-plan item an ID (`C1`, `R3`, `M2`, and so on) so the owner can approve "all except C4, R2". Name an issue's author in a close item when it isn't the owner, so they know who will be notified.

```markdown
# Board triage: <owner/repo>, <YYYY-MM-DD>

<Summary: 3 to 5 plain sentences. How big the board is and how much of it holds up; what was
found (work already done, pivots that left issues behind, duplicates); what the plan changes;
and what gets built first.>

**At a glance:** <N> open. Keep <k>. Close <c> (<d> done, <o> obsolete, <m> duplicates).
Rewrite, update, or split <r>. Done and closing on release <z>. Owner calls <q>. New <n>.

## The project today

<From picture.md, in plain language: what the product is now, the current goal, each pivot
(from what to what, and when), and the pace of completed work, said as roughly as it really is.>

## Proposed milestones

| Milestone | Goal                              | Due            | Issues | Sizes      | Change                               |
| --------- | --------------------------------- | -------------- | ------ | ---------- | ------------------------------------ |
| <title>   | <the finish line, in plain words> | <date or none> | <n>    | <2 S, 3 M> | <new, kept, renamed from X, closing> |

<Why this structure, in 2 or 3 sentences: the style (cadence or phases), how the dates follow
the repo's cadence or why there are none, and how the first milestone fits the pace.>

## Build order

<The order /orc next N will follow once the plan is applied. One numbered list per milestone,
in the order they are worked.>

### <Milestone>

1. #<n> <title>. <P1>, <Medium>. <Why it is here, one clause.> <Blocked by #m, when it is.>

### Backlog track

<The order for catch-up days: self-contained Small and Medium issues first. The first five or
so, with a reason each.>

1. #<n> <title>. <P2>, <Small>. <Why.>

Next catch-up day<, <weekday, date> when the house rules name one>: `/orc #a #b #c`

## Done, closing on release

<Issues already done on an integration branch. They stay open and out of the build order.
Say how many there are in the summary when it's more than a few.>

- #<n> <title>: <sha> on <branch>.

<Then the ones that won't close by themselves (an epic whose children are all done or closing,
or work whose commit has no closing keyword), each to close by hand after the promotion.>

- #<n> <title>: <why it won't close by itself>.

## Change plan

### Close (C)

- C1 #<n> <title> (by @<author>, when not the owner): <done | obsolete>. <Evidence: sha, PR,
  file:line, or the pivot.> Close as <completed | not planned>.

### Merge duplicates (C)

- C2 #<n> into #<kept>: <why they are one outcome>. Moves over: <what, or nothing>.

### Rewrite, update, or split, through /issues (R)

- R1 #<n> <title>: <update | rewrite | split>. <What is wrong now> -> <what the new body says>.
  Evidence: <...>. Then: <milestone>, <priority>.

### New issues, through /issues (N)

- N1 <plain title>: <the gap and its evidence>. Into <milestone>, <priority>.

### Milestones (M)

- M1 Create "<title>", due <date or none>: <goal>.
- M2 Close "<title>": <empty; its goal shipped | was dropped>.

### Priority, labels, and placement (L)

- L1 #<n>: <P1 -> P3>, <milestone none -> Backlog>, <size: M>. <Why, one clause.>

### Dependencies (D)

- D1 #<later> blocked by #<earlier>: <the real reason>. (Or: remove the link, and why.)

### Ranking rule and house rules

<The exact text to add to CLAUDE.md or .claude/rules/, and to the house rules, in a fenced
block, with the file it goes in. Or "None".>

## Decisions for you (Q)

- Q1 <the question, with what was found>. Options: <a>, <b>. Recommended: <a>, because <why>.

## Full map

| #   | Title   | Area   | Verdict   | Priority   | Milestone                | Size | Note         |
| --- | ------- | ------ | --------- | ---------- | ------------------------ | ---- | ------------ |
| <n> | <title> | <area> | <verdict> | <P2 -> P1> | <none -> Sprint: Dec 11> | <M>  | <one clause> |
```

In the full map, show a change as `before -> after`, and an unchanged value once. Sort the map by area, then by build order.
