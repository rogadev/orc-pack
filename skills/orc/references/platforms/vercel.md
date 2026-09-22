# Vercel playbook

Loaded when the repo deploys to Vercel: a `vercel.json` or `vercel.ts` file, a `.vercel/` project link, `@vercel/*` packages, or a Vercel adapter (`@sveltejs/adapter-vercel`, `@astrojs/vercel`, a Nitro `vercel` preset). Next.js repos with no other deployment target usually deploy here too. The repo's own docs and patterns still win.

## Runtimes

- **The Node.js runtime is the default** for functions and supports the full Node API. The Edge runtime is a restricted, web-API-only environment; use it only when the repo already does or when a route genuinely benefits, and check every dependency runs there.
- **Functions are stateless.** No reliance on in-memory state between invocations, and no filesystem writes outside `/tmp`, which does not persist.
- **Background work uses `waitUntil`** from `@vercel/functions` (or the framework's equivalent), never an unawaited promise.

## Configuration and secrets

- **Environment variables are set per environment** (Development, Preview, Production). Code reads them through the repo's validated config module, and secrets never reach client bundles (see the framework playbook for the public-prefix rule).
- **Preview deployments are real deployments.** Treat them as reachable: they need the same auth, and they must not write to production data unless the repo intends it.

## Caching and rendering

- **Cache deliberately.** Static pages, ISR revalidation windows, and `Cache-Control` headers are choices the change should make on purpose, per route.
- **Never cache per-user responses** in a shared CDN cache. Personalized routes are dynamic, or they vary on the right header.

## Databases and connections

- **Serverless functions scale out.** Use a pooled connection string or an HTTP-based database driver, and create clients so a warm instance reuses them without holding per-request data in module scope.

## Cost and limits

- **Function duration and memory are bounded by plan and config.** Stream long responses, and move long jobs to a queue or background function.
- **Image optimization and edge middleware are billed per use.** Keep middleware matchers narrow and its logic light, and let static assets bypass it.

## Vercel-specific slop

- Edge runtime chosen by default with no reason, then Node-only dependencies patched around.
- Unpooled database connections opened per request.
- Middleware that matches every path, including static assets.
- Fire-and-forget promises in functions.
