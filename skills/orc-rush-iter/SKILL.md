---
name: orc-rush-iter
pack: orc-pack@1.19.1
description: One /orc run inside an /orc-rush loop, with a fast review whose skipped lanes the loop's sweeps and /orc-review cover later. Invoked only by /orc-rush; standalone work uses /orc.
user-invocable: false
---

# Orc rush iteration

You run one `/orc` run inside an `/orc-rush` loop: an issue build, a sweep fix, or a triage fix. Everything is orc's except what this file changes. The changes live here, in a skill loaded on every run, so they hold even when the conversation is summarized in the middle of a run.

**Only `/orc-rush` runs this.** Its invocations contain `(the caller holds the checkout lock)`. When your arguments don't, stop and tell the user to run `/orc` instead, which keeps its full review.

**Start orc.** Invoke the `orc` skill with your arguments exactly as you received them, caller notes included, and run it with the changes below. They come from the user and outrank orc's own rules for this run.

## Scope

- **One issue only** on an issue build, even when orc's batching rule would allow more.
- **Discoveries are filed, not fixed.** Anything orc finds outside the work gets a comment on a matching open issue, or a new issue filed with `--body-file` (check open and recently closed issues first). Two exceptions stay in scope: the touched-file cleanup orc's standards require in files the task already changes, and a fix the work cannot land without. List each filing in the report.
- **A retry** carries `(previous attempt failed: ...)`: read that report and the parked work it names, reuse what was sound, and fix the failure at its root.

## Fast review

This list replaces orc's step 5 reviewer selection for a standard or structural task, on every run this skill makes. A trivial task keeps orc's single lane.

- `quality-reviewer`: when the diff changes source code. Give it `standards/comments.md` and tell it the comments on the changed lines are in its scope, so no comment lane runs.
- `scope-reviewer`: as orc. It holds the diff to the work and checks each criterion has a test.
- `security-reviewer`: as orc, on a trust boundary. A hole can't wait for a later review.
- Skip `architecture-reviewer`, `ui-reviewer`, `test-coverage-reviewer`, `comment-reviewer`, and `fallow`. The loop's sweeps cover architecture and UI; the user's `/orc-review` before promotion covers test coverage, comments, and dead code.

The rest of orc's step 5 holds. Its usages map runs only when `quality-reviewer` and `security-reviewer` both run, the only two lanes here that read it. A scoped re-review never adds a lane this list skips. After fix round two, a Warning still open is filed as an issue instead of fixed; a Blocker still open gets orc's round three, because failing the run would cost a full rebuild. Orc's design brief and design review for a structural task stay, because a wrong design costs more to undo than it saves.

A sweep fix gets this review too: it repairs findings a verifier already confirmed, and the sweep's recheck reviews it again.

## Landing

- **Without `(the caller pushes at its sweeps)`:** orc's **Land it** runs as written: it pushes, comments on the issue, and closes it.
- **With it, commit but don't land:** skip **Land it** whole: no push, no issue comment, and no close. The commits stay on the local integration branch, and the loop pushes them and closes the issues at its sweep. `FINISHED` then means every task is committed and the ready check is green; the report's **Landed** section says the commits are local.

## Report

- List your commits by full SHA in the report's **Landed** section.
- Add a **Filed** line listing every issue filed or commented on.
- **Do not end the turn on the report.** Write it and its status line, then return to `/orc-rush`, in the same message as your next tool call: to its **Record** after an issue build, or to the **Sweep** step that started you after a sweep fix.
