# Comments standard

Every builder and the `docs-writer` write to this standard. The `comment-reviewer` checks against it, as does the `quality-reviewer` when orc assigns it a trivial task's comments. It distills Google's developer documentation guidance: the [documentation best practices](https://google.github.io/styleguide/docguide/best_practices) for what each comment is for, the [API reference code comments](https://developers.google.com/style/api-reference-comments) guide for how a doc comment is worded, and the [TypeScript](https://google.github.io/styleguide/tsguide.html) and [JavaScript](https://google.github.io/styleguide/jsguide.html) style guides for JSDoc and comment form. Follow this file rather than re-fetching them. Where the repo documents its own commenting rules (in `CLAUDE.md` or `AGENTS.md`, JSDoc lint config such as `eslint-plugin-jsdoc` or `tsdoc.json`, or the tag style its files already use), the repo wins.

## The cold-read test

Every comment must make sense to someone who opens the file cold: no conversation, no ticket, no memory of the previous version of the code.

Ask of each comment:

1. Would a stranger reading only this file understand it?
2. Does it say something the code does not already say?
3. Is it still true of the code beside it?

A comment that fails any of the three gets rewritten or deleted. No comment beats a wrong or confusing comment.

## Two kinds of comment

**Documentation comments (`/** ... */`)** are for people who use the code: what it does, what it expects, what it returns, and what can go wrong. They are the contract of how the code must behave, so any behavior they promise should be something a test could check. They sit directly above the declaration they describe, and above its decorators, never between a decorator and the declaration.

**Implementation comments (`//`)** are for people who change the code: why it is written this way, the constraint a future reader would otherwise violate, the non-obvious decision. Never what the next line does. A "why" belongs here, not in the doc comment, unless the caller needs it to use the API correctly.

Never use `/** ... */` for an implementation comment.

## JSDoc: what gets one

- **Every exported function, class, method, component, hook or composable, and type or interface.**
- **Exported constants** whose meaning or unit is not obvious from the name (`/** Session lifetime in seconds. */`).
- **Props, when a component takes any.** Document the props interface or type, one short comment per prop that needs one.
- **Non-exported functions** only when the purpose or contract is not obvious from the name and signature.
- **A file overview** (a `/** ... */` block at the top, or `@fileoverview` if the repo uses it) only when the file's role is not obvious from its path and name, for example a module that must stay server-only or a file that the framework loads by convention.

Skip JSDoc on the self-evident: a `getId()` getter or a `Props` field named `disabled` needs no prose.

## JSDoc: how to write one

```ts
/**
 * Calculates the tax owed on an invoice for its billing region.
 *
 * Rates come from the region table at the invoice's issue date, not today,
 * so historical invoices keep the tax they were issued with.
 *
 * @param invoice - The invoice to price. Must have a billing region.
 * @returns The tax owed, in the invoice's currency, rounded to minor units.
 * @throws {RegionNotFoundError} If the invoice's region has no rate table.
 */
export function calculateTax(invoice: Invoice): Money {
```

**The summary sentence.** Tooltips, summaries, and indexes show only the first sentence, so it carries the most important fact. It ends with a period.

- **Functions and methods:** a verb phrase in the third person present tense that states the action: "Adds a bird to the list.", never "Add a bird" or "This function adds". Pick the verb by what the function does:
  - Performs an operation and returns data: name the operation. "Adds a bird to the list and returns the new entry's ID."
  - Boolean getter: "Checks whether ...". Other getter: "Gets the ...".
  - No return value: "Sets the ...", "Updates the ...", "Deletes the ...", "Registers ...".
  - Callback or hook the framework calls: "Called by ... when ...". When subclasses override it, add "Subclasses implement this method to ...".
  - Factory or convenience constructor: "Creates a ...".
- **Classes, interfaces, types, and components:** the purpose, in a short and specific phrase. Do not repeat the name, and never open with "This class will" or "This component does".
- **Constants and fields:** as brief as possible. Link (`{@link name}`) to the method that uses one when that helps.

**After the summary,** add detail only when it helps: how and when to use it, prerequisites, guarantees, side effects, a gotcha. Full sentences.

**Tags.**

- **Write `@param` and `@returns` only when they add information** beyond the name and type. A `@param id - The id.` is noise.
- **`@param`:** capitalize the first word and end with a period. Start a non-boolean with "The" or "A": "The ID of the bird to fetch."
  - A boolean that switches behavior states both cases: "If true, validates the certificate first. If false, trusts it without validating."
  - A boolean that describes state: "True if the zoom is set; false otherwise."
  - A parameter with a default describes the behavior for each value or range, then ends with "Default: 30."
- **`@returns`:** as brief as possible. A non-boolean starts with "The ...": "The bird with the given ID." A boolean reads "True if the bird is in the sanctuary; false otherwise." Put longer detail in the summary or the class description.
- **`@throws`** when throwing is part of the contract a caller must handle. Start the description with "If ...", because the tag already reads as "Throws".
- **`@deprecated`:** name the replacement, the version it was deprecated in when the project versions its API, and what a caller must change. Most important fact first.
- **`@example`** when correct usage is not obvious from the signature. Show the simplest use first.
- **Match the repo's tag style.** TSDoc uses `@param name - description`; some repos omit the hyphen. Follow what the repo already does.

**Form.**

- **Do not repeat types in TypeScript.** No `{string}` in `@param` or `@returns`; the signature already carries them. In plain JavaScript files that use JSDoc for types, the types are required, in braces.
- **JSDoc is Markdown.** Use a Markdown list, not lines that only look like one; extraction tools collapse plain line breaks. Put identifiers in code font (`` `userId` ``), and string literals in code font with double quotes (`` `"wrap_content"` ``). The words true and false in a "True if ...; false otherwise." phrase stay plain.
- **No "e.g.", "i.e.", or "etc."**, and no other period before the real end of a sentence: some generators end the summary at the first period. Write "for example", "that is", and "and so on".
- **One tag per line,** tag first. Indent a wrapped tag line four spaces; do not indent a wrapped summary or `@fileoverview`.
- **Stay within the file's line length** (the formatter's `printWidth` or the lint `max-len`). Formatters do not wrap comments. A one-line `/** ... */` that would overflow takes the multi-line form, with `/**` and `*/` on their own lines.
- **Other languages** use their own doc format with the same wording rules: Google-style docstrings (`Args:`, `Returns:`, `Raises:`) in Python unless the repo uses another style, and the language's convention elsewhere.

### Components, by framework

- **React and Next:** JSDoc on the component function and on its props type.
- **Vue and Nuxt:** JSDoc on the props interface passed to `defineProps`, and on emitted events where their payload is not obvious.
- **Svelte and SvelteKit:** a `<!-- @component ... -->` block at the top of the component for the component itself, and JSDoc on the props type.
- **Astro:** JSDoc on the `Props` interface in the frontmatter, and a short summary comment at the top of the frontmatter when the component's role is not obvious.

## Implementation comments

Good reasons for a `//` comment:

- **Why, not what.** `// Retry once: the upstream returns 503 during its hourly cache flush.`
- **A constraint.** `// Must run before auth middleware; the session cookie is not set yet.`
- **A non-obvious decision and its trade-off.** `// Linear scan: lists here never exceed 20 items, and a Map costs more to build.`
- **A pointer** to an issue, spec, or upstream bug that explains a workaround. Include the link.
- **A lint or type directive's reason**, on the same line or the line above. The repo's rules on directives still apply.

Write in full sentences, in plain language, in the same voice as the rest of the file. A multi-line implementation comment is consecutive `//` lines, not a `/* */` block, unless the repo does otherwise. A parameter-name comment at a call site (`/* force= */ true`) is fine when the value alone does not say what it means.

## Wording, for every comment

- **Present tense, active voice.** "Returns the cached token", not "The cached token will be returned".
- **Plain, precise words.** Drop "simply", "just", "easy", "obviously", "basically", and "please".

## Slop comments

These are the signatures of a comment written for a conversation instead of for the file. Each is a finding, and unless the item says otherwise, the fix is to delete it.

1. **Conversation residue.** The comment refers to a discussion, a request, or a change instead of the code: "as requested", "as discussed", "per your feedback", "now we", "let's", "here we", "the user wants", "this fixes the issue where...", "updated to use...", "changed from X to Y", "instead of the old approach", "the previous implementation", "NEW:", "FIX:", "UPDATED:". History belongs in the commit message. If the residue carried a real reason, rewrite it as a why-comment that stands on its own.
2. **Narration.** The comment restates the next line: `// increment the counter`, `// return the result`, `// import dependencies`, `// loop over the items`, `// call the API`.
3. **Step-by-step play-by-play** on straightforward code: `// Step 1: validate`, `// Step 2: save`, `// Step 3: return`. If the steps need labels, they want to be named functions.
4. **Section banners** in files small enough to see whole: `// ===== Helpers =====`, `// --- State ---`.
5. **Restated types or signatures:** `// takes a string and returns a number`.
6. **Emphasis and hedging:** `// IMPORTANT!!!`, `// CRITICAL`, `// This should work`, `// hopefully`, `// for now` with no plan, emojis.
7. **Stale comments** that no longer describe the code beside them. Rewrite them to match the code, or delete them. When you cannot tell whether the comment or the code is wrong, leave the comment and report it: delete what you are certain is wrong, never what is merely unclear.
8. **Commented-out code.** Version control keeps it.
9. **Orphan `TODO`s** with no issue reference or owner. A `TODO` names an issue (`// TODO(#142): ...`), or is deleted and the work goes in the report.
10. **Apologies for a hack** instead of fixing it or explaining the constraint that forces it.
11. **Undocumented exports** that the change adds or modifies (see **JSDoc: what gets one**). Add the JSDoc. Older undocumented exports in a touched file are cleanup work, documented in a cleanup run rather than as a side effect of an unrelated change.

Keep license headers, generated-file markers, and tool directives the build depends on.
