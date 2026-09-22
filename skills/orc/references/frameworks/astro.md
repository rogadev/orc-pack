# Astro playbook

Loaded when the repo has `astro` in its dependencies or an `astro.config.*` file. It adds Astro-specific rules on top of the standards files. The repo's own docs and patterns still win.

## Check the version first

Read the installed `astro` version and the config's `output` mode and adapter. Recent Astro versions provide the content layer (`src/content.config.ts` with loaders), actions (`astro:actions`), typed environment variables (`astro:env`), and server islands (`server:defer`). Use them when the installed version has them and the repo uses them. When this playbook and the installed version's docs disagree, the installed version wins.

## Islands, not an SPA

- **Ship zero JavaScript by default.** An `.astro` component renders to HTML on the server. Reach for a framework component with a `client:*` directive only when the UI is genuinely interactive.
- **Choose the laziest directive that works:** `client:visible` or `client:idle` before `client:load`, and `client:only` only for components that cannot render on the server.
- **Keep islands small.** Hydrate the interactive widget, not the whole section around it.
- **Server islands (`server:defer`)** for personalized or slow parts of an otherwise static page.

## Structure

- **`src/pages/`** is the router: `.astro` pages, and `.ts` endpoints exporting `GET`, `POST`, and so on.
- **`src/components/`, `src/layouts/`**, and the repo's own `src/lib/` for logic.
- **Content collections** for structured content, with a schema in the content config, queried through `getCollection` and `getEntry`. Do not read Markdown files with `fs` or glob imports when a collection fits.
- **Frontmatter stays thin:** fetch through the data layer, shape the props, and render. Logic lives in `src/lib/`.

## Data and mutations

- **Fetch in frontmatter or endpoints, on the server.** Parallelize independent requests.
- **Actions (`astro:actions`)** for mutations, with an input schema, called from forms or islands. Expected failures throw an `ActionError` with a code in the handler; callers handle the returned `error` rather than assuming success.
- **Static or on-demand rendering is a deliberate per-page choice** (`export const prerender`). Personalized or auth-dependent pages are never prerendered.

## Environment

- **`astro:env`** with a schema for typed variables when the version supports it; otherwise `import.meta.env`, where only `PUBLIC_` variables reach the client. Secrets never go in public variables or in props passed to a hydrated island.

## Quality

- **Typed `Props` interface** in every component's frontmatter, with JSDoc (see `comments.md`).
- **`<Image />` and `<Picture />`** from `astro:assets` for local images.
- **Scoped `<style>`** or the repo's styling system; `is:global` only when styling content the component does not own.
- **`set:html` only with sanitized content** (the security reviewer checks it).

## Astro-specific slop

- A `client:load` framework component where static `.astro` markup would do.
- A whole page built as one hydrated React, Vue, or Svelte island.
- Reading content files with `fs` or `import.meta.glob` instead of a content collection.
- Secrets passed as props into a hydrated island, which serializes them into the HTML.
- Business logic in page frontmatter.

## Deployment

With `@astrojs/cloudflare`, read bindings through the adapter's runtime access (`Astro.locals.runtime.env`, or the `cloudflare:workers` `env` import in newer setups). With `@astrojs/vercel`, choose static, serverless, or ISR per route deliberately. See the platform playbooks.
