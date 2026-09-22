# Nuxt playbook

Loaded when the repo has `nuxt` in its dependencies or a `nuxt.config.*` file. It adds Nuxt-specific rules on top of the standards files. The repo's own docs and patterns still win.

## Check the version first

Read the installed `nuxt` version. Nuxt 4 moves app code into an `app/` directory (with `server/`, `shared/`, and `public/` at the root) and changes some data-fetching defaults compared with Nuxt 3. Check which layout the repo uses before placing files. When this playbook and the installed version's docs disagree, the installed version wins.

## Structure

- **Follow Nuxt's directories:** `pages/`, `layouts/`, `components/`, `composables/`, `utils/`, `middleware/`, `plugins/`, and `server/` (`server/api/`, `server/routes/`, `server/middleware/`, `server/utils/`). Auto-imports depend on these locations, so a file in the wrong directory silently stops resolving.
- **Server code lives in `server/`** and never imports from the client app. Code shared by both goes in `shared/` (Nuxt 4) or a module both can import safely.
- **Composables start with `use`** and hold reusable stateful logic. Plain helpers go in `utils/`.
- **Respect auto-imports.** Do not add explicit imports for auto-imported APIs unless the repo does, and do not create two composables or components with colliding names.

## Data fetching

- **`useFetch` or `useAsyncData` for data a page or component needs on render.** They run on the server, transfer the result to the client, and avoid a double fetch. Give `useAsyncData` a stable, unique key.
- **`$fetch` for event-driven calls** (a button click, a form submit), never at the top level of `setup` for render data, which fetches twice.
- **Parallelize independent requests**, and use `pick` or `transform` to keep payloads small.
- **Handle `pending`, `error`, and empty states** from the returned refs (see `ui.md`).

## Server routes

- **`defineEventHandler` in `server/api/`**, with input validated by the repo's schema library (`readValidatedBody` and `getValidatedQuery` accept a validator).
- **Throw `createError({ statusCode, statusMessage })`** for expected failures; never return a raw error object.
- **Keep handlers thin:** call domain and data modules in `server/utils/` or the repo's service layer.

## State and config

- **`useState` for SSR-safe shared state**, or Pinia when the repo uses it. Never a module-level `ref` for per-request state; it leaks between users on the server.
- **`runtimeConfig` for configuration.** Secrets go in the private keys; only `runtimeConfig.public` reaches the client. Read them with `useRuntimeConfig()`, not `process.env`.

## Vue-specific quality

- **`<script setup lang="ts">`** with typed `defineProps` and `defineEmits`.
- **`computed` for derived values**, not a `watch` that writes another ref.
- **Do not mutate props**; emit an event or use `defineModel`.
- **Stable `:key`s on `v-for`**, never the index for lists that reorder.
- **Never put `v-if` and `v-for` on the same element.**
- **`v-html` only with sanitized content** (the security reviewer checks it).

## Nuxt-specific slop

- `$fetch` in `setup` for render data, or `onMounted` plus fetch for data the server could load.
- `watch` used to sync state that `computed` would derive.
- Explicit imports of auto-imported APIs mixed with implicit ones in the same codebase.
- Module-level reactive state in server-rendered code.
- `process.env` reads outside `nuxt.config`.

## Deployment

Nitro targets Cloudflare and Vercel with presets. On Cloudflare, read bindings from `event.context.cloudflare.env` in server routes and respect the Workers runtime (see the Cloudflare playbook).
