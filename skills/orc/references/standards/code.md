# Code standard

The implementer writes to this standard and the reviewers check against it. It applies to every language the repo uses, with examples in TypeScript because that is where most of the pack's work lands.

## Precedence

When two sources disagree, the higher one wins:

1. The repo's own docs (`CLAUDE.md`, `AGENTS.md`, contributing guides, ADRs).
2. The repo's established patterns in the code around the change.
3. The framework and platform playbooks orc loaded for this repo.
4. This file.

A client repo with its own structure and conventions is followed as it is. Never reshape a repo to match this file; raise the disagreement in the report instead.

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
- **Suppressions are a last resort.** A `@ts-expect-error` or `eslint-disable` is acceptable only when the cause is outside the repo's control (for example a wrong third-party type), the repo's rules allow it, and a comment at the site gives the reason and, where one exists, the upstream issue. Everywhere else, fix the cause. This is the one rule every reviewer applies.
- **Validate at the boundary, trust inside.** Untrusted data (request bodies, params, form data, upstream responses, `localStorage`, environment variables) is parsed with the repo's schema library (for example Zod or Valibot) where it enters. After that point the types are true, and code inside does not re-check them.
- **Derive types from one source of truth.** Infer from the schema (`z.infer`), the database layer's generated types, or the function (`ReturnType`, `Awaited`). Re-declaring a shape that already exists is duplication.
- **Model states, not flags.** A discriminated union (`{ status: 'loading' } | { status: 'error'; error: E } | { status: 'ready'; data: T }`) beats three booleans that can contradict each other.
- **Narrow, precise types.** Literal unions over `string`, readonly where mutation is not intended.

## Errors

- **Fail loudly and early.** Throw or return an error at the point where the problem is known. An empty array returned on failure is a lie the caller cannot detect.
- **Catch only what you can handle.** A `catch` either recovers, translates the error into the framework's error mechanism, or adds context and rethrows (`new Error('Could not load invoice', { cause })`). A catch that only logs and continues is a finding unless the operation is genuinely optional, and then the code says why.
- **Narrow before use.** `catch (error)` gives `unknown`; check `error instanceof` before reading properties.
- **Expected failures use the framework's mechanism**: `error()` and `fail()` in SvelteKit, `createError` in Nuxt, `notFound()` and error boundaries in Next, and a thrown `ActionError` in an Astro action (the caller receives it as the action's `error`). See the loaded framework playbook.
- **Users see a message they can act on**, never a raw exception or stack trace.
- **Log through the repo's logger**, with enough context to debug, and never log secrets or personal data.

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

1. **Defensive noise.** Null checks on values the types guarantee, `try`/`catch` around code that cannot throw, `?? ''` and `|| []` fallbacks that hide a bug instead of surfacing it, the same validation repeated at every layer. Validate once at the boundary and trust the types after.
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

## Touched files

A file the task modifies is in scope for cleanup, within limits:

- **In scope:** slop in the functions and components the diff changes, and file-level slop anywhere in the file (unused imports, dead code, `console.log`, commented-out code, slop comments).
- **Behavior-preserving only.** Cleanup never changes what the code does. A behavior bug found during cleanup is its own `fix:` change.
- **Proportionate.** When a touched file needs a rewrite larger than the task itself, the reviewer marks it a **cleanup candidate** and orc runs it as a separate task, so the task's own diff stays reviewable. "Cleanup candidate" always means a file the task touches.
- **Untouched files are out of scope.** Quality debt elsewhere is a **cleanup target**: it goes in the report for a later cleanup run, not into this diff and not into a new task.

## What is not a finding

Churn is its own kind of slop. Do not flag, and do not change:

- Working code that matches the repo's conventions but not your preference.
- A pattern the repo uses consistently, even if you would choose another. Consistency wins.
- Formatting the repo's formatter already owns.
- Micro-optimizations with no measured or obvious cost.

A finding names a concrete cost: a bug, a misleading read, a maintenance trap, a real performance problem, or a documented rule broken. "I would have written it differently" is not a finding.
