# Model tiers: the evidence

Read this when you re-tier the pack's agents, for example when a new Opus, Sonnet, or Fable release lands. The everyday rules live in `CLAUDE.md` under **Model assignments are intentional**, and orc's runtime rules live in `skills/orc/SKILL.md` under **Model selection** and **Efficiency mode**.

## Why Sonnet 5.5 holds only one default lane

Sonnet 5.5's per-token price is half of Opus 5.5's, but at the effort levels most agents here run, Opus 5.5 scores well above it. On Artificial Analysis's general Intelligence Index by effort level (as read by Aivy on 2026-09-28, cost per task in AUD):

- Opus 5.5 at `low` (42.3, $0.77) outscores Sonnet 5.5 at `medium` (40.7, $0.82) for about the same cost.
- Opus 5.5 at `medium` (51.2, $1.88) roughly ties Sonnet 5.5 at `xhigh` (51.9, $3.85) for half the cost.
- Sonnet 5.5 is competitive at `high` (46.7, $1.52), between Opus 5.5 `low` and `medium`, and at `low` (35.8, $0.58) as the cheapest point overall.

The index is general rather than a coding or review measure, so treat it as direction.

`test-coverage-reviewer` moved from Sonnet 5 to Sonnet 5.5 in 1.9.0: same price, and on CodeRabbit's 13 hard review cases Sonnet 5.5 caught 6 known issues to Sonnet 5's 4, at similar precision and $0.47 against $1.16 per review.

The agents that stay on Opus 5.5 at `high` stay there for a different reason: they do security work or irreversible data changes, where the Sonnet 5.5 system card rates Opus 5.5 better on most honesty measures and strictly better on approval-gate bypass, circumventing constraints, and proposing security shortcuts.

Avoid `max` on Sonnet 5.5. On FrontierCode it scored lower at `max` (46.2) than at `xhigh` (52.1), because in cases Cognition examined it ran Claude Code's code-review skill and timed out or made out-of-scope edits.

## Why Fable 5.1 has only two jobs

Researched on 2026-10-06. Opus 5.5 is the default because it matches or beats Fable 5.1 on almost every coding measure at well under half the cost:

- Opus 5.5 leads every benchmark in Anthropic's launch table, for example Terminal-Bench 4.0 (66.4% against 55.8%), CursorBench 4.0 (57.8% against 51.8%), and FrontierCode v1.1 (54.4% against 50.3%).
- Opus 5.5 costs $4 and $20 per million input and output tokens against Fable 5.1's $10 and $50, and it runs faster (about 97 against 68 tokens per second).
- On Artificial Analysis, Opus 5.5 at `high` ties Fable 5.1 at `max` for about a quarter of the cost per task, and Opus 5.5 hallucinates far less (non-hallucination 0.41 against 0.27).

Fable 5.1 keeps two edges, and the pack uses it for exactly those:

- **Open-ended visual design.** Testers consistently rate Fable's visual output as more polished and less templated when the brief leaves the visual direction open. In one four-build comparison, Fable won the open-ended design build, while Opus 5.5 won the fixed-spec brand build. So orc runs `ui-implementer` on Fable for the brief and first build of a structural UI task, where the visual direction is decided, and keeps standard and trivial UI work, which extends an existing design system, on Opus 5.5.
- **A second look at work Opus keeps getting wrong.** Anthropic and independent guides recommend escalating to Fable only when Opus 5.5 at a higher effort still falls short. Since 1.18.0 a dispatch can raise an agent's effort, so orc escalates in two steps: round two of a fix loop runs at `high` effort on Opus 5.5, and round three runs on Fable. In a debugging comparison, Fable finished every run but gamed a flaky test by deleting a simulated delay, while Opus 5.5 sometimes overthought and ran out of output. That's why orc treats a round-three fix that weakens a test as a Blocker.

Fable 5.1 isn't used for review or verification. The evidence for its edge is about producing designs, not judging them, and Opus 5.5's lower hallucination rate matters most in the verifier.

Sources:

- [Anthropic: Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- [Artificial Analysis: Opus 5.5 vs Fable 5.1](https://artificialanalysis.ai/models/releases/comparisons/claude-opus-5-5-vs-claude-fable-5-1)
- [Aivy: Claude Opus 5.5 vs Fable 5.1](https://aivy.com.au/resources/claude-opus-5-5-vs-fable-5-1/)
- [The New Stack: One overthinks, the other cuts corners](https://thenewstack.io/claude-opus-5-5-vs-fable-5-1/)
- [Claude Opus 5.5 tested: four builds against Fable 5.1 and GPT-6 Astra](https://www.ai.joaoqueiros.com/blog/claude-opus-5-5-four-builds-fable-gpt-6-astra)
- [UX Magic: Opus vs Fable for UI design](https://uxmagic.ai/blog/claude-opus-vs-fable-ui-design)

## What `opusplan` and the advisor teach

Researched on 2026-10-20. Claude Code's `opusplan` alias "uses `opus` during plan mode, then switches to `sonnet` for execution", pairing Opus's reasoning for planning with Sonnet's efficiency for execution. Orc can't use it directly, because orc never enters plan mode and an `opusplan` session would coordinate orc itself on Sonnet. The idea still transfers, and the pack applies it through effort rather than a model switch:

- **Why not Sonnet builders.** The numbers in the first section hold: Opus 5.5 at `low` (42.3) outscores Sonnet 5.5 at `medium` (40.7) for about the same cost, and Opus 5.5 at `medium` (51.2) ties Sonnet 5.5 at `xhigh` (51.9) for half the cost. Moving a builder to Sonnet buys a lower per-token price and loses quality at equal spend, so builders stay on Opus 5.5.
- **Where effort goes.** Anthropic's effort guidance puts `low` on a small, precise change such as a rename, `medium` on day-to-day work with a clear scope, and `high` on work where verification matters. Orc follows it: `high` for design briefs and the design review (plan quality decides a structural task), `low` for a trivial build, frontmatter for the rest. Security review, the verifier, and `data-implementer` are never lowered.
- **Escalation order.** Anthropic's model-and-effort article separates a model that "didn't try hard enough" (raise effort) from one that "didn't know enough" (use a larger model). Fix round two therefore runs at `high` on Opus 5.5 and round three moves to Fable.
- **Efficiency mode.** Sonnet 5.5 at `high` (46.7) sits between Opus 5.5 at `low` and `medium`, so the fix-round move now carries `effort: high`; the scout keeps its frontmatter `low`, because orc checks its pick. The same figures end the trivial-build move: Opus 5.5 at `low` ($0.77) costs about half of Sonnet 5.5 at `high` ($1.52). The advisor tool, which Anthropic pairs as "Sonnet main + Opus advisor", supplies the Opus check on orc's own calls that the mode lacked. It is experimental and Anthropic-API only, so orc recommends it and never requires it.
- **Haiku 5.5.** It costs $0.10 and $0.50 per million input and output tokens, but trails Sonnet 5.5 on Terminal-Bench 4.0 (39.2% against 70.6%) and SWE-Bench Pro (64.8% against 81.3%), with no SWE-bench Verified score published. The runners make no judgement calls, so they stay on Haiku and no judgement lane moves to it.

Sources:

- [Claude Code: model configuration (`opusplan`)](https://code.claude.com/docs/en/model-config)
- [Claude Code: subagents, choose a model and effort](https://code.claude.com/docs/en/sub-agents)
- [Claude Code: the advisor tool](https://code.claude.com/docs/en/advisor)
- [Anthropic: Choosing a Claude model and effort level in Claude Code](https://claude.com/blog/claude-model-and-effort-level-in-claude-code)
- [Haiku 5.5 benchmarks (third-party summary of Anthropic's launch table)](https://apidog.com/blog/claude-haiku-5-5-benchmarks/)

## Review lanes on small standard tasks

Started on 2026-10-20 for issue #35: does a standard task with a small diff need every review lane? Orc sends a standard task through each lane whose surface the diff touches, with no size scaling, so a 50-line change and a 400-line change get the same panel. This section collects the evidence before any rule changes. The evidence is lanes and verified findings only, with no token counts: the review share quoted in #35 came from orc's former token ledger, which overstated reviewer cost.

| Task                                          | Diff                 | Lanes that ran                                                                                                                        | Raised per lane                                                            | Confirmed per lane                                                  | Notes                                                                                                                            |
| --------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Observed run in #35 (another TypeScript repo) | 3 files, +54 and -6  | `quality-reviewer`, `scope-reviewer`, `comment-reviewer`, `architecture-reviewer`, `test-coverage-reviewer`, `fallow`, `verifier`     | Not recorded per lane                                                      | 0 in every lane                                                     | The one real problem (the issue's premise was wrong) was caught by the builder before review. 7 review dispatches, no fix round. |
| #36, `/orc-loop` batch                        | 4 files, +17 and -39 | `quality-reviewer`, `scope-reviewer`; `comment-reviewer`, `architecture-reviewer`, `test-coverage-reviewer`, and `fallow` skipped (-) | Round 1: quality 1 Warning and 4 Nits, scope 0. Round 2: quality 1 Warning | Round 1: quality 5 of 5, scope -. Round 2: not sent to the verifier | Light review, because `orc-loop-iter` leaves the other lanes to the batch passes. 2 fix rounds.                                  |

**How to add a row.** Take the lanes that ran, the fix rounds, and the findings each lane raised and the verifier confirmed, from the `Lanes:` line orc writes in every task's commit body, including the tasks `/orc-loop` runs; a loop's saved reports under `.git/orc-loop/` add its batch review rounds. Add only standard tasks under about 100 changed lines, and use "-" for a lane that did not run. A light-review row (from `/orc-loop`) shows only the lanes it ran, so it cannot show whether a skipped lane was needed; count only full-panel rows toward the five. Decide only once the table holds at least five such rows.

**Decision.** Interim: no rule change. Only one full-panel row exists today, which cannot show that any lane is safe to drop; revisit at five full-panel rows. Whatever the table later shows, `security-reviewer` and `verifier` are never skipped because a diff is small.

## Efficiency mode design

Efficiency mode (1.9.0, with `high` effort and the optional advisor added in 1.18.0) is the one sanctioned exception to the tiers. A user who starts orc on Sonnet 5.5 is asked to confirm, or opts in with `/orc efficiency mode …`. Orc then coordinates on Sonnet 5.5 and moves two dispatches to it: `next-issue-finder` at its frontmatter `low` effort, and a first fix round that carries no Blocker and no security finding, at `high`. An Opus 5.5 lane reviews the fix afterward: a re-review that always includes `quality-reviewer` when the fix changed source code. Only orc checks the scout's pick, which is acceptable because a wrong pick costs a wasted cycle, not a bad commit. Orc also skips the Fable move for structural UI tasks. Nothing else moves.

The build of a trivial task moved too, from 1.9.0 until 1.18.0. It stays on Opus 5.5 now, because 1.18.0 builds a trivial task at `low` effort: Opus 5.5 at `low` ($0.77 per task) costs about half of Sonnet 5.5 at `high` ($1.52), so the move would raise the bill the mode exists to lower.

The mode's main quality risk is the orchestrator itself on Sonnet 5.5: no Opus model checks its own calls, and Claude Code's default effort for it is `medium` (the question recommends `/effort high`). The mode contains that risk by handing decisions to Opus agents: on a second design `REVISE` orc takes the reviewer's position, and it routes ready-check fixes and trivial discovery fixes through builders instead of editing code itself. Widen the mode only with evidence from real runs, and keep an Opus check behind anything you move.
