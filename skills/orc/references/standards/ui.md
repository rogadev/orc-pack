# UI and UX standard

What a well-made interface needs: it looks right, works well, and makes sense. The implementer writes to this standard, the `design-reviewer` checks UI design briefs against it, and the `ui-reviewer` checks the built result, rendered where possible.

## Precedence

1. The repo's design system: its tokens, components, and documented usage rules.
2. The app's existing theme and screens. A new screen looks like it belongs to the same app.
3. This file.

Never introduce a new visual language into an existing app. When the repo has a design system, a one-off style next to it is a finding even if the one-off looks good.

## Theme and design system

- **Tokens only.** Color, spacing, radius, typography, shadow, z-index, breakpoints, and motion come from the repo's tokens (CSS custom properties, Tailwind theme, a tokens file). A hard-coded hex value, pixel spacing outside the scale, or an arbitrary Tailwind value (`p-[13px]`) is a finding unless the design system genuinely lacks the value, and then the fix is to add a token.
- **Use the existing primitives.** Buttons, inputs, dialogs, menus, toasts, and tables come from the repo's component library. Do not hand-roll one, and do not fork one to change a detail; extend it through its props or variants.
- **No new variants on a whim.** A fourth button style needs a reason the existing three cannot meet.
- **Dark mode parity.** When the app supports themes, every new surface works in each of them, through tokens rather than per-theme overrides.

## Visual hierarchy and layout

- **One primary action per view or section.** Secondary and destructive actions look secondary and destructive.
- **Type scale, not ad hoc sizes.** Headings follow the app's scale and the document's heading order.
- **A spacing rhythm.** Related items sit closer than unrelated ones; spacing comes from the scale and is consistent with sibling screens.
- **Alignment.** Content aligns to the app's grid and containers. Ragged edges and near-miss alignments are findings.
- **Density matches the app.** A data-dense admin table and a marketing page have different densities; a new screen matches its neighbors.
- **Content first.** Decoration never competes with the task the screen exists for.

## Every state, designed

A UI that handles only the success state is unfinished. For each data-driven view or component, handle:

- **Loading:** a skeleton or placeholder that matches the final layout, so nothing jumps when data arrives. Show it only when loading is perceptible.
- **Empty:** say what would be here and give the next action ("No invoices yet. Create your first invoice.").
- **Error:** say what went wrong in plain language, how to recover, and keep the user's input. Offer retry where it helps.
- **Partial and stale data:** show what is available and mark what is not.
- **Success and confirmation:** confirm consequential actions visibly.
- **Disabled:** when a control is unavailable, make the reason discoverable.
- **Long content:** long names, long lists, and large numbers truncate or wrap deliberately, never overflow.

## Interaction

- **Immediate feedback.** Every action acknowledges itself within about 100 ms: a pressed state, a spinner in the button, an optimistic update.
- **Pending submissions** disable the submit control and prevent double submission.
- **Optimistic updates roll back** visibly on failure.
- **Destructive actions** confirm, or better, offer undo.
- **Forms:** visible labels (placeholders are not labels), the right input type and `autocomplete`, validation on submit and on blur (not on every keystroke), errors next to the field and summarized for long forms, focus moved to the first error.
- **Progressive enhancement** where the framework supports it: forms that work before JavaScript loads (SvelteKit form actions, Next server actions in forms, Astro actions with forms).
- **Navigation makes sense.** The user always knows where they are, how they got there, and how to get back. No dead ends.

## Responsive

- **Mobile first.** Check at about 390 px, 768 px, and 1280 px or wider.
- **No horizontal scrolling** at any width, except inside a component designed for it, such as a data table.
- **Touch targets** at least 44 by 44 px on touch layouts (WCAG 2.2 sets 24 px as the minimum).
- **Layouts reflow**, they do not shrink. Container queries beat viewport breakpoints for reusable components.

## Accessibility (WCAG 2.2 AA)

- **Semantic HTML first:** real buttons, links, lists, headings, landmarks, and tables. ARIA only where no element does the job.
- **Accessible names:** every interactive element has one; icon-only buttons have a label.
- **Images:** meaningful `alt` text, or `alt=""` for decoration.
- **Contrast:** 4.5:1 for body text, 3:1 for large text and UI component boundaries, in every theme.
- **Keyboard:** everything works with a keyboard, in a logical order, with a visible focus indicator.
- **Focus management:** dialogs trap and restore focus; route changes move focus sensibly.
- **Announcements:** async status (saved, failed, results updated) reaches screen readers through a live region.
- **Color is never the only signal** for state or meaning.
- **Motion respects `prefers-reduced-motion`.**
- **Framework accessibility warnings are fixed**, never suppressed.

## Copy

- **Sentence case** for headings, buttons, and labels, unless the app's existing copy uses another convention.
- **Buttons say what happens:** "Save invoice", not "Submit" or "OK".
- **One term per concept** across the app.
- **Errors are specific and kind:** what happened and what to do, with no blame and no jargon.

## Motion

- **Purposeful:** motion shows where something came from or went, or confirms an action. Never decoration for its own sake.
- **Quick:** roughly 150 to 300 ms for UI transitions, using the app's easing tokens.

## Performance you can see

- **No layout shift:** images and embeds have dimensions; fonts load without reflowing the page.
- **Images** are sized for their slot, use modern formats, and lazy-load below the fold, through the framework's image component where there is one.
- **Interactions stay responsive:** no long main-thread tasks on input. Heavy client code is split or moved to the server.

## Makes sense

The hardest check, and the most important. Read the screen as a user who has never seen it:

- Is it obvious what this screen is for and what to do first?
- Does it use the same patterns as the rest of the app for the same jobs?
- Is anything on screen that does not help the task?
- Does the flow match how the user thinks about the task, not how the data is stored?
