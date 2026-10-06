# Model tiers: the evidence

Read this when you re-tier the pack's agents, for example when Haiku 5.5 ships or a new Opus, Sonnet, or Fable release lands. The everyday rules live in `CLAUDE.md` under **Model assignments are intentional**, and orc's runtime rules live in `skills/orc/SKILL.md` under **Model selection** and **Efficiency mode**.

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
- **A second look at work Opus keeps getting wrong.** Anthropic and independent guides recommend escalating to Fable only when Opus 5.5 at a higher effort still falls short. A dispatch can't raise an agent's effort, so a model switch is orc's only escalation lever, and round three of a fix loop runs on Fable. In a debugging comparison, Fable finished every run but gamed a flaky test by deleting a simulated delay, while Opus 5.5 sometimes overthought and ran out of output. That's why orc treats a round-three fix that weakens a test as a Blocker.

Fable 5.1 isn't used for review or verification. The evidence for its edge is about producing designs, not judging them, and Opus 5.5's lower hallucination rate matters most in the verifier.

Sources:

- [Anthropic: Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- [Artificial Analysis: Opus 5.5 vs Fable 5.1](https://artificialanalysis.ai/models/releases/comparisons/claude-opus-5-5-vs-claude-fable-5-1)
- [Aivy: Claude Opus 5.5 vs Fable 5.1](https://aivy.com.au/resources/claude-opus-5-5-vs-fable-5-1/)
- [The New Stack: One overthinks, the other cuts corners](https://thenewstack.io/claude-opus-5-5-vs-fable-5-1/)
- [Claude Opus 5.5 tested: four builds against Fable 5.1 and GPT-6 Astra](https://www.ai.joaoqueiros.com/blog/claude-opus-5-5-four-builds-fable-gpt-6-astra)
- [UX Magic: Opus vs Fable for UI design](https://uxmagic.ai/blog/claude-opus-vs-fable-ui-design)

## Efficiency mode design

Efficiency mode (1.9.0) is the one sanctioned exception to the tiers. A user who starts orc on Sonnet 5.5 is asked to confirm, or opts in with `/orc efficiency mode …`. Orc then coordinates on Sonnet 5.5 and moves three dispatches to it: `next-issue-finder`, the build of a trivial task, and a first fix round that carries no Blocker and no security finding. An Opus 5.5 lane reviews the last two afterward: the task's review lane, and a re-review that always includes `quality-reviewer`. Only orc checks the scout's pick, which is acceptable because a wrong pick costs a wasted cycle, not a bad commit. Orc also skips the verifier when a task's panel returns only Nits with no Cleanup candidate, and it skips the Fable move for structural UI tasks. Nothing else moves.

The mode's main quality risk is the orchestrator itself on Sonnet 5.5: no Opus model checks its own calls, and Claude Code's default effort for it is `medium` (the question recommends `/effort high`). The mode contains that risk by handing decisions to Opus agents: on a second design `REVISE` orc takes the reviewer's position, and it routes ready-check fixes and trivial discovery fixes through builders instead of editing code itself. Widen the mode only with evidence from real runs, and keep an Opus check behind anything you move.
