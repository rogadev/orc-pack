# Next.js playbook

Loaded when the repo has `next` in its dependencies or a `next.config.*` file. It adds Next-specific rules on top of the standards files. The repo's own docs and patterns still win.

## Check the version first

Read the installed `next` version from the lockfile or `node_modules/next/package.json`, and check whether the repo uses the App Router (`app/`), the Pages Router (`pages/`), or both. Next changes conventions between majors, for example caching defaults, async request APIs (`params`, `searchParams`, `cookies()`, and `headers()` are async in recent versions), and the middleware file (renamed to `proxy.ts` in newer versions). When this playbook and the installed version's docs disagree, the installed version wins. Never apply App Router rules to a Pages Router file.

## Server and client components (App Router)

- **Server components are the default.** Add `'use client'` only to the smallest component that needs state, effects, event handlers, or browser APIs. A `'use client'` at the top of a page or layout is a finding unless the whole subtree is interactive.
- **Push the client boundary down.** Keep the data-loading parent as a server component and pass serializable props into a small client child.
- **Props that cross into a client component must be serializable.** No functions (except server actions), class instances, or database objects.
- **Server-only modules import `server-only`.** Anything touching secrets, the database, or privileged clients does, so an accidental client import fails the build.
- **Client-exposed env vars start with `NEXT_PUBLIC_`**, and nothing secret ever does.

## Data loading

- **Fetch in server components** or in the data layer they call, not in client `useEffect`.
- **Parallelize independent fetches** with `Promise.all`, and use `Suspense` boundaries with `loading.tsx` to stream slow parts instead of blocking the page.
- **Deduplicate per-request reads** with React `cache()` when several components need the same data.
- **Caching is explicit.** Know the installed version's defaults. Mark dynamic and cached data deliberately (`revalidate`, `cache` options, `'use cache'` where the version supports it), and never cache per-user data in a shared cache.

## Mutations

- **Server actions or route handlers, following the repo.** A server action is a public endpoint: validate its input with the repo's schema library and check authorization inside it, every time.
- **Revalidate what the mutation changes** (`revalidatePath`, `revalidateTag`) so reads refresh.
- **Forms use actions** so they work before hydration, with `useActionState` or `useFormStatus` for pending and error states.

## Routing files

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` (a client component), `not-found.tsx`, and `route.ts` have fixed names and allowed exports. Exporting an unsupported name from a page or layout can fail the build.
- **Use `notFound()` and `redirect()`** from `next/navigation` for expected outcomes, and `error.tsx` boundaries for unexpected ones.
- **Route groups `(name)`** organize without changing URLs; private folders `_name` hold colocated non-route code.
- **`generateMetadata` or the `metadata` export** for titles and SEO, not hand-built `<head>` tags.

## Assets and performance

- **`next/image`** with dimensions or `fill` plus `sizes`; **`next/font`** for fonts; **`next/link`** for internal navigation.
- **Dynamic import** heavy client-only components with `next/dynamic`.
- **Keep middleware or proxy logic light.** It runs on every matched request.

## Next-specific slop

- `'use client'` on everything, or on pages that only render data.
- `useEffect` plus `fetch` for data a server component could load.
- `useState` mirroring props or search params.
- Server actions with no input validation or authorization check.
- Route handlers that exist only to be called by the app's own server components; call the data layer directly.
- `any` on `params` or `searchParams` instead of the typed props the version provides.

## Deployment

Vercel is Next's native target (see the Vercel playbook). On Cloudflare, Next runs through the OpenNext adapter; read bindings with the adapter's context helper and respect the Workers runtime (see the Cloudflare playbook).
