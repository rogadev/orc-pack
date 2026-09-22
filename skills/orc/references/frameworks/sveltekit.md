# SvelteKit playbook

Loaded when the repo has `@sveltejs/kit` in its dependencies. It adds SvelteKit-specific rules on top of the standards files. The repo's own docs and patterns still win.

## Check the version first

Read the installed `svelte` and `@sveltejs/kit` versions. Svelte 5 uses runes (`$state`, `$derived`, `$effect`, `$props`); Svelte 4 syntax (`export let`, `$:`, stores for local state) is legacy. Match what the repo uses, and write runes in new code on a Svelte 5 repo. Newer SvelteKit versions add remote functions (`.remote.ts` files with `query`, `form`, and `command`); use them only when the repo already does or has enabled them. When this playbook and the installed version's docs disagree, the installed version wins.

## Routing files

- `+page.svelte`, `+layout.svelte`, `+page.ts`, `+page.server.ts`, `+layout.server.ts`, `+server.ts`, and `+error.svelte` have fixed names and allowed exports. An unknown export from a `+page` or `+layout` module fails the build.
- **`+page.server.ts` for loads that need secrets, the database, or cookies**, and for form actions. **`+page.ts` for universal loads** that can also run in the browser.
- **Route groups `(name)`** organize routes without changing URLs.

## Server-only code

- **Secrets, database clients, and privileged modules live in `$lib/server/`** or in `.server.ts` files. SvelteKit refuses to bundle them into client code, and the architecture reviewer confirms nothing tries.
- **Environment variables come through `$env/static/private`, `$env/dynamic/private`, and the `public` equivalents.** Only `PUBLIC_`-prefixed variables reach the client. No `process.env`.

## Data loading

- **Return data from `load`**, not from `onMount` fetches.
- **Parallelize independent requests in a load** with `Promise.all`, and return unawaited promises for slow, non-critical data so the page can stream.
- **Use the `fetch` passed to `load`**, which carries cookies and avoids a second request during hydration.
- **Invalidate deliberately** with `depends` and `invalidate` rather than reloading the page.

## Mutations

- **Form actions** in `+page.server.ts`, with input validated by the repo's schema library, returning `fail(status, data)` for validation errors so the form can re-render with the user's input.
- **`use:enhance`** for progressive enhancement, with pending state handled in the callback.
- **`+server.ts` endpoints** for non-form clients (webhooks, external API consumers), not for the app's own pages.
- **`error()` and `redirect()`** from `@sveltejs/kit` for expected outcomes.

## Svelte 5 quality

- **`$derived` for computed values.** An `$effect` that assigns state is a finding.
- **`$effect` only for side effects** that touch the outside world, with cleanup returned.
- **Typed `$props()`** with a documented props type; `$bindable` only where two-way binding is the intent.
- **Snippets instead of slots** in Svelte 5 code.
- **Shared reactive state** in a `.svelte.ts` module, and never module-level state for per-request data on the server; use `event.locals` or context.
- **`{@html}` only with sanitized content** (the security reviewer checks it).
- **`{#each}` blocks with a key** for lists that change.

## SvelteKit-specific slop

- `onMount` plus `fetch` for data a `load` could provide.
- Legacy `$:` reactive statements or `export let` in new code on a Svelte 5 repo.
- Stores used for component-local state on Svelte 5.
- `+server.ts` endpoints called by the app's own pages instead of a load or form action.
- Form actions that throw on validation failure instead of returning `fail()`.

## Deployment

`adapter-cloudflare` reads bindings from `event.platform.env` (type them in `app.d.ts`); `adapter-vercel` supports per-route runtime config. See the platform playbooks.
