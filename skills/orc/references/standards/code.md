# Code standard

The reviewers check every change against this standard. It applies to every language the repo uses, with examples in TypeScript because that is where most of the pack's work lands.

## Precedence

When two sources disagree, the higher one wins:

1. The repo's own docs (`CLAUDE.md`, `AGENTS.md`, contributing guides, ADRs).
2. The repo's established patterns in the code around the change.
3. The framework and platform playbooks the review loaded for this repo.
4. This file.

A client repo with its own structure and conventions is followed as it is. Never reshape a repo to match this file; raise the disagreement in the report instead.

**Item 2 covers conventions, never defects.** The repo's patterns decide names, layout, and its choice among sound ways to do a thing. They never make a workaround (see **Workarounds**) or a known defect acceptable, however many copies there are: agents copy the nearest example, so each copy left in place invites the next.

## The bar

Code is written for the next reader, not for the compiler. A reviewer should be able to read a changed function once, top to bottom, and know what it does, why it exists, and what it guarantees. When that takes a second read, the code is not done.

## Readability

- **Names say what a thing is or does, in the domain's language.** `invoicesDueThisWeek`, not `data`, `result`, `list2`, or `temp`. Booleans read as predicates (`isArchived`, `hasAccess`). Functions are verbs (`calculateTax`), and event handlers say what triggers them (`handleSubmit`, `onRowSelect`).
- **One responsibility per function.** If describing a function needs "and", split it. As a rough signal, a function past about 40 lines or a component past about 150 lines is a decomposition candidate, not a violation on its own.
- **One level of abstraction per function.** A function that orchestrates steps calls well-named helpers; it does not also parse strings and build SQL inline.
- **Shallow nesting.** Use guard clauses and early returns. More than three levels of nesting is a finding.
- **No magic values.** A number or string with meaning gets a named constant next to the code that uses it, or in the module that owns the concept.
- **Explicit over clever.** A plain loop beats a dense `reduce` that needs a comment to decode. Chained ternaries are a finding; use `if` or a lookup object.
- **Consistent within the file.** One async style (`await`, not a mix of `await` and `.then`), one export style, one naming convention.

## Types

- **Strict types, no escape hatches.** No `any`, no `as` casts to silence the checker, no non-null `!`, no `@ts-ignore`. The one sanctioned cast is at a boundary right after the value was validated, and it carries a comment saying so.
- **Suppressions are a last resort.** A `@ts-expect-error` or `eslint-disable` is acceptable only when the cause is outside the repo's control (for example a wrong third-party type), the repo's rules allow it, and a comment at the site gives the reason and, where one exists, the upstream issue. Everywhere else, fix the cause.
- **Validate at the boundary, trust inside.** Untrusted data (request bodies, params, form data, upstream responses, `localStorage`, environment variables) is parsed with the repo's schema library (for example Zod or Valibot) where it enters. After that point the types are true, and code inside does not re-check them.
- **Derive types from one source of truth.** Infer from the schema (`z.infer`), the database layer's generated types, or the function (`ReturnType`, `Awaited`). Re-declaring a shape that already exists is duplication.
- **Model states, not flags.** A discriminated union (`{ status: 'loading' } | { status: 'error'; error: E } | { status: 'ready'; data: T }`) beats three booleans that can contradict each other.
- **Narrow, precise types.** Literal unions over `string`, readonly where mutation is not intended.

## Errors

- **Fail loudly and early.** Throw or return an error at the point where the problem is known. An empty array returned on failure is a lie the caller cannot detect.
- **Catch only what you can handle.** A `catch` either recovers, translates the error into the framework's error mechanism, or adds context and rethrows (`new Error('Could not load invoice', { cause })`). A catch that only logs and continues is a finding unless the operation is genuinely optional, and then the code says why.
- **Narrow before use.** `catch (error)` gives `unknown`; check `error instanceof` before reading properties.
- **Expected failures use the framework's mechanism** (see the loaded framework playbook).
- **Users see a message they can act on**, never a raw exception or stack trace.
- **Log through the repo's logger**, with enough context to debug, and never log secrets or personal data.
- **Calls across a boundary** (a model or AI provider, an API, an auth gateway, a database) follow `errors.md`: each failure mode classified, with its own message, log event, and test.

## Workarounds

A workaround makes a symptom go away while its cause stays: a timer, `requestAnimationFrame`, or `queueMicrotask` that waits out a race; a retry around the repo's own code; a guard against a state that should never exist; a swallowed error; a fallback value that hides a bad input; a suppression.

- **Fix the cause when it's in this repo.** A guard is a fix only when the state it handles is legitimate.
- **A workaround is acceptable only when its cause is outside the repo's control,** such as a third-party bug or a platform limit, and the site names that cause, with the upstream issue when there is one. Suppressions in **Types** follow the same rule.
- **A comment doesn't excuse it.** A comment that names the real fix ("the proper fix is to validate this upstream, but that's a bigger change") names a fix in this repo, so it is evidence for the finding, not a reason to drop it.
- **Copies don't make it a pattern.** A shared helper that wraps a workaround is still a workaround. A change that adds another copy, or another call to that helper, gets the finding the first copy would; name the existing copies as pre-existing.

## Async and data

- **Independent work runs concurrently.** Two `await`s on unrelated requests in sequence is a latency bug; use `Promise.all` (or `Promise.allSettled` when partial success is valid).
- **No N+1.** Fetching a list and then fetching each item in a loop is the most expensive common mistake. Batch, join, or use the data layer's include or relation feature.
- **Fetch where the framework wants it.** Server-side data loading (loaders, server components, `useFetch` on the server) beats client-side fetch waterfalls. See the playbook.
- **Cancel what can outlive its caller.** Requests tied to a component or navigation pass an `AbortSignal`.
- **Select what you use.** No `SELECT *` or full-document fetches to read two fields.

## State (UI code)

- **Derive, do not sync.** A value computable from other state is derived (`$derived`, `computed`, a plain expression during render). An effect that copies one state into another is a finding.
- **Effects are for side effects** that touch the outside world (subscriptions, DOM APIs, analytics), not for data flow.
- **Keep state as local as it can be**, and lift it only when a second consumer needs it.
- **Server state belongs to the data layer** (the framework's loader or the repo's query library), not in hand-rolled component state.

## Reuse and dependencies

- **Reuse before writing.** Search the repo for an existing helper, component, hook, or composable before adding one. A second implementation of something the repo already has is a finding even when the new one is fine on its own.
- **Use the platform.** `Intl` for formatting, `URL` and `URLSearchParams` for URLs, `structuredClone`, `crypto.randomUUID`, and `AbortController` beat hand-rolled versions and new packages.
- **No new dependency** without a clear need the repo cannot meet. A new package is a supply-chain decision; say why in the report.

## AI slop code

These are the signatures of code written to look finished rather than to be right. Each is a finding. In a file the task touches, fix it as part of the task (see **Touched files** below).

1. **Defensive noise.** Null checks on values the types guarantee, `try`/`catch` around code that cannot throw, `?? ''` and `|| []` fallbacks that hide a bug instead of surfacing it, the same validation repeated at every layer.
2. **Pass-through layers.** A function that only calls another function with the same arguments, a `Manager`, `Helper`, or `Service` class with one method and no state, a wrapper component that forwards every prop. Inline it or give it a real job.
3. **Speculative generality.** Options, generics, factory functions, strategy patterns, or config flags with one caller and no second on the way. Build for the case that exists.
4. **Reinvented utilities.** A hand-rolled debounce, date formatter, class-name joiner, deep clone, or fetch wrapper when the repo or the platform already has one.
5. **Duplicate types.** An interface re-declared in a second file, or a type written by hand that should be inferred.
6. **Type escape hatches.** `as any`, `as unknown as T`, `!`, and suppression comments (see **Types**).
7. **Verbose logic.** `if (x) { return true } else { return false }`, `=== true`, `else` after `return`, negated conditions with an `else`, a `switch` that maps values a lookup object would.
8. **Leftover scaffolding.** `console.log`, commented-out code, unused imports, variables, parameters, and exports, dead branches, feature flags that are always on, and `TODO`s with no issue reference.
9. **History in names.** `newHandler`, `handleSubmitV2`, `fixedParse`, `improvedLayout`, `oldConfig`. A name describes what the thing is now, not how it got there.
10. **Stringly typed code.** Status, role, and kind values passed as free strings where the repo has, or should have, a union or enum.
11. **Synced state.** An effect or watcher that keeps two pieces of state in step (see **State**).
12. **Inconsistent idioms.** Code that reads as if three authors wrote it: mixed async styles, mixed error strategies, mixed naming in one file.
13. **Slop tests.** Tests that assert a mock was called instead of asserting behavior, snapshot everything, assert `toBeDefined()`, or mock the module under test. The test-coverage reviewer owns these.
14. **Slop comments.** Covered by the comments standard, `comments.md`.
15. **Symptom patches.** A workaround for a cause inside the repo, with or without a comment defending it (see **Workarounds**).

## Touched files

A file the task modifies is in scope for cleanup, within limits:

- **In scope:** slop in the functions and components the diff changes, and file-level slop anywhere in the file (unused imports, dead code, `console.log`, commented-out code, slop comments).
- **Behavior-preserving only.** Cleanup never changes what the code does. A behavior bug found during cleanup is its own `fix:` change.
- **Proportionate.** When a touched file needs a rewrite larger than the task itself, the reviewer marks it a **cleanup candidate** to be handled as separate work, so the task's own diff stays reviewable. "Cleanup candidate" always means a file the task touches.
- **Untouched files are out of scope.** Quality debt elsewhere is a **cleanup target**: it goes in the report for a later cleanup run, not into this diff and not into a new task.

## What is not a finding

Churn is its own kind of slop. Do not flag, and do not change:

- Working code that matches the repo's conventions but not your preference.
- A convention the repo uses consistently, even if you would choose another. Consistency wins, except for a workaround or a defect (see **Precedence**).
- Formatting the repo's formatter already owns.
- Micro-optimizations with no measured or obvious cost.

A finding names a concrete cost: a bug, a misleading read, a maintenance trap, a real performance problem, or a documented rule broken. "I would have written it differently" is not a finding.
