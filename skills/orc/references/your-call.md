# Your call

What an orc run hands back to the user, and what it settles itself. `/orc` reads this before it writes **9. Report**, and `/orc-loop` gives it to its triage agents. People run orc to get work finished, not handed back, so the report's **Your call** section holds only the calls reserved for the user, and **Needs you** only the work that cannot proceed without a person. Everything else is decided, acted on, and reported where it landed.

## Settle it first

Find where each item belongs:

- **Small, and the right change is clear:** do it this run.
- **Real and worth doing, but Medium or larger, or outside this repo:** file an issue and list it under **Board**. Search open and recently closed issues first, and comment on a match instead of filing a near-duplicate. Write the title and first paragraph so a non-technical PM can follow them, then the files, the evidence, and the recommended fix, and put the size band (Small, Medium, Large, or Huge) in the body so a later run can scope it. Add the repo's labels when they fit.
- **A choice that is not a reserved call,** whether one option is clearly better or it is a real toss-up: take your recommendation, act on it, and report it under **Heads-up** as the choice, the reason, and how to reverse it (`/orc-loop` lists clear decisions under **Handled** instead).
- **Not real, already covered by an issue, or not worth its cost:** drop it.
- **Work that cannot proceed without a person,** because it needs access the run lacks (VPN, SSO, a production or shared environment, a device), a credential, or a change to a shared environment. A step the skill itself routes here (a rebase conflict, a deploy step, a red CI run) counts too. List it under **Needs you** with the exact step. File an issue too when work remains for a later run once the person has done it. A check the run could perform locally (a test, a build, a local screenshot) is never a step for a person, and a check it cannot perform is acted on with the best evidence and reported under **Heads-up** as `Unverified: <what>, check: <the one step>`. A step that spends money is a reserved call.

Two things are never items at all. Opening the pull request from the integration branch to the release branch is the normal next step after every run, not a decision. Nits live in commit bodies and review reports, not in the report's decisions.

## The toss-up test

An item is a toss-up only when all three hold after you have investigated it:

1. **The evidence doesn't settle it.** The code, the issue and its comments, the repo's docs and `CLAUDE.md` / `AGENTS.md`, the git history, and the user's stated preferences have been read, and none of them decides between the options.
2. **A senior engineer on this project could pick either option and defend it,** because the choice turns on something only the user knows or owns: what the product should do, how much risk or cost they accept, or what comes first.
3. **Choosing wrong costs real rework or harm.** When the losing option is cheap to reverse later, it is not a toss-up: take the better default.

Before you call an item a toss-up, ask what an expert in the room would do. If they would just pick one and move on, pick that one.

**Decide a toss-up yourself** unless it is a reserved call. Take your recommendation, act on it, and report it under **Heads-up**: the choice, the reason, and how to reverse it, with the size band of the reversal when it takes more than a revert. The test marks the choices worth a careful look and a clear reversal note, not the ones to hand back.

## Reserved calls

A reserved call goes to **Your call** even when its answer is clear, because it is the user's by right, not by difficulty. Only reserved calls reach **Your call**. They are a legal or policy statement, a security boundary, an external API contract, a decision to spend money, an action that cannot be undone without losing data, and anything the user or the repo's docs say is theirs to make. Its card keeps the recommendation, and says so when the answer is clear.

## The last check

Before you list an item under **Needs you**, or treat a choice as reserved because it feels like the user's, ask: if the user answered "you decide", what would you do? If there is an answer, do that and report it under **Heads-up**. A call on the reserved list above skips this check.

## The card

Every **Your call** item is one card in this shape:

```
**<The decision, as a question>** · <Size> · <surface, for example "data change">
Options: <A>, or <B>.
Recommend: <the option>, because <the deciding reason>. <Second opinion agrees. | Second opinion prefers <B>: <its case in one line>. | Clear, but this call is yours.>
Trade-off: <what each option costs, as an expert would weigh it, in one or two lines>
Flips if: <the fact or preference that would change the recommendation>
Until you decide: <what the run left in place>
Issue: filed #N | exists #N | none, keeping today's behavior needs no work
```

- **Size** is the band of the work the recommended option needs, never an hour estimate.
- **Recommend** always names one option. Write the second-opinion sentence only when a second agent checked the decision, as `/orc-loop` does; otherwise end the line after the reason, or with "Clear, but this call is yours." when the answer is clear.
- **Issue** takes exactly one of its three forms. File one, with both options and the recommendation in its body, whenever either option needs work, so the decision has a home on the board.
