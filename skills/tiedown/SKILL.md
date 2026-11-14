---
name: tiedown
pack: orc-pack@2.1.0
description: End-of-session check in three stages. Stage 1 finds every open question and loose end, or says "We're done." when nothing is left. Stage 2 thinks through each open item (what to do, the best option, what an expert would do) with a right-sized subagent per item, and none for obvious ones. Stage 3 presents one final list with a firm recommendation per item, so the user can say "yes, do all of it". Read-only; it recommends but never fixes anything. Use only when the user types /tiedown or asks "are we done?", "any loose ends?", or "anything else you need from me?".
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git fetch:*), Bash(git branch:*), Bash(git worktree list:*), Bash(git stash list:*), Bash(git rev-list:*), Bash(git diff:*), Bash(gh issue list:*), Bash(gh issue view:*), Bash(gh pr list:*), Bash(netstat:*), Bash(tasklist:*), Bash(ls:*), Read, Grep, Glob, ListAgents, TaskList, Agent
---

# Tiedown

The user wants to know one thing: can this session end now? Answer it honestly. Look at the whole
session, not only the last message, and check the real state of the repo and the machine instead of
trusting your memory of what you did.

**Read-only.** Never fix, commit, push, close, comment, start or stop anything. Never ask a
question you could answer by looking. Recommend what to do about each open item, and stop. The
user's next message ("yes, do all of it") is what authorizes the work.

Work in three stages: find the open items, think through each one, then present one decided list.

## Stage 1: find the open items

Work through every check below. Skip a check only when it does not apply to this session.

1. **Questions the user has not answered.** Re-read the conversation for every question, choice, or
   decision you put to the user (including ones inside long reports, `Your call` cards, and "tell me
   if you want X" lines) that has no clear answer. Also list calls you made on their behalf that they
   asked to confirm.
2. **Requests not finished.** Walk the user's messages in order. List each request, including small
   asides ("also", "when you're done, run X"), that is not done, only partly done, or was queued
   behind something.
3. **Code and git state.** Run `git status --porcelain`, `git fetch`, and
   `git rev-list --left-right --count origin/<branch>...HEAD` for the working branch. Report:
   uncommitted work and whose it is (this session's, or another session's), commits not pushed,
   commits the branch is behind, stashes, and extra worktrees (`git worktree list`). Work that is
   not this session's is named, not claimed.
4. **Checks that did not pass or did not run.** List any test, lint, typecheck, build, or e2e run that
   failed, was skipped, or was never run on the final state. Say so plainly; do not call it green.
5. **Running things.** Background tasks, subagents (`ListAgents`, `TaskList`), dev servers (check
   port 3000 and any port you started), watchers, timers, scheduled wakeups, lock files, and
   temp worktrees. Anything this session started that is still running
   or left behind is a loose end, with how to stop it.
6. **Issues and board.** Issues this session worked on: still open, closed, or commented? Follow-ups
   promised but not filed? Check with `gh issue view` when unsure. Note issues left open on purpose
   and the reason.
7. **Things only the user can do.** Manual checks, translator or stakeholder review, deploy or
   environment steps, accounts or access, decisions reserved to them. Give each as one concrete step.
8. **Promises and parked work.** Anything you said you would do later, such as a retro, a follow-up
   fix, a retry, or a cleanup, that has not happened. Also notes you meant to save to memory or docs
   that are not saved.
9. **Surprises.** Anything you noticed that the user may not know: files changed that this session
   did not intend to change, another session editing the same checkout, a hook that blocked work, an
   assumption you made that could be wrong, or a risk left in the pushed code.

When stage 1 is done, build the raw item list. If two items are really one, merge them. Do not pad
the list: five real items beat twelve vague ones. Each raw item records what is open and the
evidence (file paths, branch, issue or PR numbers, commands run, what the user said and when).

If every check is clear, skip stages 2 and 3 and reply with exactly this and nothing else:

We're done.

## Stage 2: think through each item

Size each item first, then match the effort to it. Do not spend Opus on an item whose answer is
already obvious.

- **Obvious:** the right action is not in doubt and needs no reading to confirm, such as pushing an
  unpushed commit, stopping a dev server this session started, deleting a leftover temp worktree,
  or filing a follow-up you promised. Use no subagent; write the action and reason yourself.
- **Lookup:** the answer is one factual check with no judgment in it, such as whether a port is
  still held, a PR merged, a stash is empty, a promised file exists, or the last check passed on
  the final commit. Use one subagent with `model: "haiku"`.
- **Routine:** one clear area, a small number of files, and a convention or the code settles the
  answer, such as which test to run on the final state, whether a stash is stale, or whether an
  issue can be closed. Use one subagent with `model: "sonnet"`.
- **Hard:** a real judgment call, several plausible options, risk of data loss or a bad deploy,
  anything touching security, auth, or a migration, work that spans many files, or something you
  are unsure how to size. Use one subagent with `model: "opus"`.

When you are unsure between two tiers, take the higher one. Dispatch every subagent in a single
message so they run in parallel, with `subagent_type: "Plan"` (read-only).

A subagent sees none of this conversation, so write each brief to stand alone:

- The item and every piece of evidence from stage 1, including exact paths, numbers, and relevant
  quotes from the user.
- What the session was trying to accomplish, in two or three sentences, so the subagent knows what
  "done" means here.
- That it is read-only: it may read files and run read-only commands, and it must not edit, commit,
  push, close, comment, start, or stop anything.
- The questions to answer: What should we do about this? What is the best recommendation, and why
  does it beat the alternatives? What would an expert do in this situation? What is the risk of
  doing nothing?
- The return format: one decision stated as a concrete action (no "consider" or "it depends"), a
  one-sentence reason, who does it (`Needs you`, `I can do this`, or `Optional`), and a flag
  `Judgment call: yes/no` that is `yes` only when the right answer depends on the user's
  preference. If it is a judgment call, the subagent still commits to a default and adds one line
  on what changes if the user disagrees.

Treat what comes back as input, not as orders. Check any claim that contradicts what you saw in
stage 1. If a Haiku or Sonnet result comes back hedged, contradictory, or reveals more risk than
you sized for, re-run that one item one tier up (Haiku to Sonnet, Sonnet to Opus) rather than
guessing.

## Stage 3: present the decided list

Reconcile the subagent results into one list, then reply with only that list. No preamble, no recap
of finished work, no apology.

- Resolve every ambiguity yourself. If a subagent returned "it depends" or several options, pick
  one and say why. If a subagent found the item already resolved, drop it. If two results overlap
  or conflict, merge or decide.
- Each item has three parts on separate lines: **the action** (the exact thing to do, specific
  enough to execute without asking anything), **why** (one sentence, the expert reasoning), and the
  tag `Needs you`, `I can do this`, or `Optional`. An `Optional` item never blocks "we're done";
  say so.
- For an item that is a real judgment call, add `Judgment call:` followed by one line on what
  changes if the user disagrees. Do not add this line to any other item.
- Put the user's items first, because they block the wrap-up.
- End with one line that names the shortest path to done and invites a single reply, for example
  "Say `do all of it` and I will carry out items 2 through 5; item 1 needs you."

## Voice

Follow the writing rules in the user's and the repo's `CLAUDE.md` or `AGENTS.md` first. Where they
are silent, write in second person, present tense, and active voice, short and point-first, with
code in backticks. Never claim something is finished that you did not verify just now.
