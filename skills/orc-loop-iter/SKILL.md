---
name: orc-loop-iter
pack: orc-pack@1.16.0
description: One /orc run inside an /orc-loop batch, with a lighter per-task review whose skipped lanes the loop runs once over the whole batch. Invoked only by /orc-loop; standalone work uses /orc.
user-invocable: false
---

# Orc loop iteration

You run one `/orc` run inside an `/orc-loop` batch: an issue build, a CI fix, a review fix, the fallow fix, or the comment fix at the end of the batch. Everything is orc's except what this file changes, mainly a lighter review, because the loop reviews the batch as a whole afterward.

**Only `/orc-loop` runs this.** Its invocations contain `(the caller holds the checkout lock)`. When your arguments don't, stop and tell the user to run `/orc` instead, which keeps its full review.

**Start orc.** Invoke the `orc` skill with your arguments exactly as you received them, opt-in words and caller notes included, and run it with the changes below. They outrank orc's own rules for this run, as the loop's overrides in its **Build one issue** step do.

## Why the review is split

A defect in an early issue spreads when a later issue builds on it: a misplaced module, a wrong contract, an untested module the next issue changes, a sloppy pattern the next builder copies as the house style, or a gap in a trust boundary. The per-task review keeps every lane that catches those. The lanes whose findings nothing later builds on run once over the whole batch instead, in the loop's round 1, its fallow pass, and its comment cleanup, so the batch pays for them once rather than once per task.

## Light review

This list replaces orc's step 5 reviewer selection for a standard or structural task. Trivial tasks keep orc's single lane, including `comment-reviewer` for a diff that changes only comments, such as the loop's comment fix.

- `quality-reviewer`: as orc dispatches it, and it also takes the light comment pass (below).
- `scope-reviewer`: as orc. It is the only lane that holds the diff to this run's contract, and the contract does not outlive the run.
- `architecture-reviewer`, `ui-reviewer`, and `security-reviewer`: as orc.
- `fallow`: skip. The loop's fallow pass runs once over everything the batch changed, just before its comment cleanup.
- `test-coverage-reviewer`: as orc, except skip it on a standard task when your arguments contain `(the batch's issues are independent)`: the loop picked those issues to avoid sharing files, so no later issue is meant to build on this one's code, and the loop's round 1 checks its coverage once. `scope-reviewer` still checks each criterion's test.
- `comment-reviewer`: skip. The loop's comment cleanup reads every file the batch changed, once, after the last fix.

Everything else in step 5 is unchanged. A scoped re-review after a fix never adds a lane this list skips.

### Light comment pass

Give `quality-reviewer` `standards/comments.md` and tell it that the comments on the changed lines are in its scope for this dispatch, the same assignment orc gives it on a trivial code task, so the comment check costs no extra dispatch. Comments elsewhere in a touched file wait for the loop's comment cleanup.

## Fixes from a loop report

When the task is to fix findings in an `/orc-loop` report under `<git-dir>/orc-loop/reviews/`, the loop's `verifier` has already confirmed them. Run it as an ordinary directed free-text task, even when every finding is about comments, and never as a **Cleanup run**: skip its audit, its characterization tests, and its contract shape. Plan the tasks straight from the report. A fix that changes only comments commits as `docs:`.
