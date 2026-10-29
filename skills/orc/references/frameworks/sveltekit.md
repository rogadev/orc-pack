# SvelteKit playbook

SvelteKit-specific rules on top of the standards files. The repo's own docs and patterns still win.

## Check the version first

Read the installed `svelte` and `@sveltejs/kit` versions. Svelte 5 uses runes (`$state`, `$derived`, `$effect`, `$props`); Svelte 4 syntax (`export let`, `$:`, stores for local state) is legacy. Match what the repo uses, and write runes in new code on a Svelte 5 repo. Newer SvelteKit versions add remote functions (`.remote.ts` files with `query`, `form`, and `command`); use them only when the repo already does or has enabled them. When this playbook and the installed version's docs disagree, the installed version wins. The rules below are written in SvelteKit 2's forms; on SvelteKit 3, read them through the next section.

## SvelteKit 3

Observed in repos that ran the `sveltekit-3` codemod; confirm each against the installed version's docs and the repo's own code before you rely on it.

- **Config:** there is no `svelte.config.js`; options go to `sveltekit({ ... })` in `vite.config.ts`, and `tsconfig.json` extends `$app/tsconfig`.
- **`$lib` is gone:** `src/lib` is imported through a package.json subpath import (`"imports": { "#lib/*": "./src/lib/*" }`) as `#lib/...`, with the file extension. Server-only code lives in `#lib/server/`.
- **Environment:** `$env/*` is deprecated. Variables are declared in a `src/env.ts` and read through `$app/env/private` and `$app/env/public`, often re-exported by a server module. `$app/environment` is now `$app/env`.
- **Renamed APIs:** `refreshAll` replaces `invalidateAll` (and keeps `page.state`); `Response.json` replaces the `json()` helper; `error()` takes three arguments; `goto` options are renamed; `resolve()` with a route ID, or `resolvePathname` for a runtime path, from `$app/paths` replaces `base`. `$app/state` replaces `$app/stores`.

A finding that asks for a SvelteKit 2 form on a SvelteKit 3 repo is wrong.

## Routing files

- `+page.svelte`, `+layout.svelte`, `+page.ts`, `+page.server.ts`, `+layout.server.ts`, `+server.ts`, and `+error.svelte` have fixed names and allowed exports. An unknown export from a `+page` or `+layout` module fails the build.
- **`+page.server.ts` for loads that need secrets, the database, or cookies**, and for form actions. **`+page.ts` for universal loads** that can also run in the browser.
- **Route groups `(name)`** organize routes without changing URLs.

## Server-only code

- **Secrets, database clients, and privileged modules live in `$lib/server/`** or in `.server.ts` files. SvelteKit refuses to bundle them into client code, and the architecture reviewer confirms nothing tries.
- **Environment variables come through `$env/static/private`, `$env/dynamic/private`, and the `public` equivalents.** Only `PUBLIC_`-prefixed variables reach the client. No `process.env`.

## Data loading

- **Return data from `load`**, not from `onMount` fetches.
- **Return unawaited promises from a load** for slow, non-critical data so the page can stream.
- **Use the `fetch` passed to `load`**, which carries cookies and avoids a second request during hydration.
- **Invalidate deliberately** with `depends` and `invalidate` rather than reloading the page.

## Mutations

- **Form actions** in `+page.server.ts`, with input validated by the repo's schema library, returning `fail(status, data)` for validation errors so the form can re-render with the user's input.
- **`use:enhance`** for progressive enhancement, with pending state handled in the callback.
- **`+server.ts` endpoints** for non-form clients (webhooks, external API consumers), not for the app's own pages.
- **`error()` and `redirect()`** from `@sveltejs/kit` for expected outcomes.

## Svelte 5 quality

- **`$effect` returns its cleanup.**
- **Typed `$props()`** with a documented props type; `$bindable` only where two-way binding is the intent.
- **Snippets instead of slots** in Svelte 5 code.
- **Shared reactive state** in a `.svelte.ts` module, and never module-level state for per-request data on the server; use `event.locals` or context.
- **`{@html}` only with sanitized content** (the security reviewer checks it).
- **`{#each}` blocks with a key** for lists that change.

## SvelteKit-specific slop

- `onMount` plus `fetch` for data a `load` could provide.
- Legacy `$:` reactive statements or `export let` in new code on a Svelte 5 repo.
- Stores used for component-local state on Svelte 5.
- `+server.ts` endpoints called by the app's own pages instead of a load or form action, unless the repo documents why (for example a gateway session that lapses on the background requests loads and remote functions make).
- Form actions that throw on validation failure instead of returning `fail()`.

## Deployment

`adapter-cloudflare` reads bindings from `event.platform.env` (type them in `app.d.ts`); `adapter-vercel` supports per-route runtime config. See the platform playbooks.
