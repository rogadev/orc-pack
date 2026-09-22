# Comments standard

The implementer writes to this standard, and the `comment-reviewer` and `docs-writer` check against it. It follows the Google TypeScript and JavaScript style guides. Where the repo documents its own commenting rules, the repo wins.

## The cold-read test

Every comment must make sense to someone who opens the file cold: no conversation, no ticket, no memory of the previous version of the code. They see only the file.

Ask of each comment:

1. Would a stranger reading only this file understand it?
2. Does it say something the code does not already say?
3. Is it still true of the code beside it?

A comment that fails any of the three gets rewritten or deleted. No comment beats a wrong or confusing comment.

## Two kinds of comment

**Documentation comments (`/** ... */`)** are for people who use the code: what it does, what it expects, what it returns, and what can go wrong. They sit directly above the declaration they describe.

**Implementation comments (`//`)** are for people who change the code: why it is written this way, the constraint a future reader would otherwise violate, the non-obvious decision. Never what the next line does.

## JSDoc: what gets one

- **Every exported function, class, method, component, hook or composable, and type or interface.** Google's rule is that all top-level exports are documented.
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
 * @throws {RegionNotFoundError} When the invoice's region has no rate table.
 */
export function calculateTax(invoice: Invoice): Money {
```

- **Start with a one-sentence summary** in the third person present tense ("Calculates...", "Returns...", "Renders..."), ending with a period.
- **Add detail only when it helps:** the contract, a guarantee, a constraint, a gotcha. Full sentences.
- **Do not repeat types in TypeScript.** No `{string}` in `@param` or `@returns`; the signature already carries them. In plain JavaScript files that use JSDoc for types, the types are required.
- **Write `@param` and `@returns` only when they add information** beyond the name and type. A `@param id - The id.` is noise.
- **Use `@throws`** when throwing is part of the contract a caller must handle.
- **Use `@example`** when correct usage is not obvious from the signature.
- **Use `@deprecated`** with the replacement to use instead.
- **Match the repo's tag style.** TSDoc uses `@param name - description`; some repos omit the hyphen. Follow what the repo already does.

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

Write in full sentences, in plain language, in the same voice as the rest of the file.

## Slop comments

These are the signatures of a comment written for a conversation instead of for the file. Each is a finding.

1. **Conversation residue.** The comment refers to a discussion, a request, or a change instead of the code: "as requested", "as discussed", "per your feedback", "now we", "let's", "here we", "the user wants", "this fixes the issue where...", "updated to use...", "changed from X to Y", "instead of the old approach", "the previous implementation", "NEW:", "FIX:", "UPDATED:". History belongs in the commit message.
2. **Narration.** The comment restates the next line: `// increment the counter`, `// return the result`, `// import dependencies`, `// loop over the items`, `// call the API`.
3. **Step-by-step play-by-play** on straightforward code: `// Step 1: validate`, `// Step 2: save`, `// Step 3: return`. If the steps need labels, they want to be named functions.
4. **Section banners** in files small enough to see whole: `// ===== Helpers =====`, `// --- State ---`.
5. **Restated types or signatures:** `// takes a string and returns a number`.
6. **Emphasis and hedging:** `// IMPORTANT!!!`, `// CRITICAL`, `// This should work`, `// hopefully`, `// for now` with no plan, emojis.
7. **Stale comments** that no longer describe the code beside them.
8. **Commented-out code.** Version control keeps it.
9. **Orphan `TODO`s** with no issue reference or owner. A `TODO` names an issue (`// TODO(#142): ...`) or becomes one.
10. **Apologies for a hack** instead of fixing it or explaining the constraint that forces it.
11. **Undocumented exports** that the change adds or modifies (see **JSDoc: what gets one**). Older undocumented exports in a touched file are cleanup work, documented in a cleanup run rather than as a side effect of an unrelated change.

## Fixing slop comments

- **Narration, banners, emphasis, and residue:** delete them. If the residue carried a real reason, rewrite it as a why-comment that stands on its own.
- **Stale comments:** rewrite them to match the code, or delete them.
- **Commented-out code:** delete it.
- **Orphan `TODO`s:** reference an existing issue, or delete the `TODO` and put the work in the report.
- **Missing JSDoc on an export the change adds or modifies:** add it.

Keep license headers, generated-file markers, and tool directives the build depends on.
