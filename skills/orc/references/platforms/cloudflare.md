# Cloudflare playbook

Loaded when the repo deploys to Cloudflare: a `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc` file, a Cloudflare adapter (`@sveltejs/adapter-cloudflare`, `@astrojs/cloudflare`, `@opennextjs/cloudflare`, a Nitro `cloudflare` preset), or `wrangler` in the scripts. The repo's own docs and patterns still win.

## The runtime is not Node

Workers run on `workerd`, built on web-standard APIs.

- **Prefer web APIs** (`fetch`, `Request`, `Response`, `crypto.subtle`, `URL`, streams) over Node built-ins.
- **Node APIs need the `nodejs_compat` flag** and are a subset. Check the wrangler config before using one, and do not add a dependency that assumes a full Node runtime (native modules, the filesystem, long-lived TCP) without confirming it runs on Workers.
- **No filesystem.** Static files are assets; generated or uploaded files go to R2.

## Bindings and configuration

- **Resources arrive as bindings** on the `env` object (D1, KV, R2, Durable Objects, Queues, Hyperdrive, service bindings, secrets). Read them through the framework's access path: `event.platform.env` in SvelteKit, `event.context.cloudflare.env` in Nuxt, the OpenNext context helper in Next, the adapter's runtime in Astro, or the `env` import from `cloudflare:workers` where the repo uses it.
- **Type the bindings.** Generate types with `wrangler types` (or the repo's equivalent) and keep them in sync when a binding changes.
- **The wrangler config is the source of truth** for bindings, compatibility date and flags, routes, and environments. A new binding in code without the matching config entry is a finding.
- **Secrets** come from `wrangler secret` in production and `.dev.vars` (never committed) locally. Never put a secret in `vars` in the committed config.

## Request isolation

- **No per-request data in module scope.** An isolate serves many requests; a module-level variable holding a user, a session, or a request-scoped client leaks between users. Module scope is only for immutable configuration and stateless helpers.
- **Create request-scoped clients per request**, or use Hyperdrive for pooled Postgres connections.
- **Background work uses `ctx.waitUntil`** (or the framework's equivalent), never an unawaited promise, which the runtime may cancel.

## Storage choices

- **KV is eventually consistent** and read-optimized. Never use it for data that must be read back immediately after a write, such as counters, locks, or session writes.
- **D1** for relational data: parameterized statements only, `batch` for multiple writes, and migrations through `wrangler d1 migrations`.
- **R2** for objects and uploads, with size and type validated before the write.
- **Durable Objects** for coordination and strongly consistent per-entity state.

## Limits

- **CPU time and memory are bounded per request** (see the plan's limits). Avoid large in-memory transforms; stream request and response bodies.
- **Subrequests per invocation are capped.** Batch or queue fan-out work.

## Cloudflare-specific slop

- Node-only packages or APIs used without checking compatibility.
- Module-level caches of request data.
- Fire-and-forget promises without `waitUntil`.
- KV used as a database.
- Bindings typed as `any` instead of generated types.
