# Structure standard

Separation of concerns and file and folder layout. The implementer writes to it, the `design-reviewer` checks design briefs against it, and the `architecture-reviewer` checks diffs against it. The loaded framework playbook adds the framework's own rules on top.

## Precedence

The repo's documented structure wins, then its established layout, then the framework's conventions, then this file. Client repos often sit inside a larger existing platform; follow their structure exactly, and put any structural disagreement in the report instead of the diff.

## Layers

Most web features pass through the same layers. Each has one job, and dependencies point one way: down this list, never up.

| Layer                            | Job                                                                                                       | Examples                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Routes and entry points**      | Parse the request, call the domain, shape the response. Thin.                                             | Pages, layouts, route handlers, server actions, loaders, form actions, API endpoints |
| **UI components**                | Render state and emit user intent.                                                                        | Presentational components, feature components                                        |
| **UI state and composition**     | Client state, derived values, glue between components and data.                                           | Hooks, composables, stores, runes modules                                            |
| **Domain logic**                 | The business rules. Plain functions and types, framework-agnostic where practical, and easy to unit test. | Pricing, permissions, validation rules, state machines                               |
| **Data access and integrations** | Talk to the outside world: database, external APIs, storage, queues.                                      | Repositories, API clients, storage adapters                                          |
| **Config and environment**       | Load, validate, and expose configuration and secrets, once.                                               | A validated env module, feature config                                               |

Rules that follow:

- **Entry points stay thin:** parse, validate, delegate, respond. Business rules inlined into a route handler, loader, or component that the repo keeps in a domain module is a finding.
- **Domain logic does not import UI or framework request objects.** It takes plain values and returns plain values.
- **I/O lives at the edges.** A component or domain function that calls `fetch` or the database directly, when the repo has a data layer for it, is a finding. Framework patterns that deliberately fetch in a component, such as React Server Components or Astro frontmatter, still call into the data layer rather than inlining queries.
- **Server-only code stays server-only.** Secrets, privileged clients, and database access live in modules the framework marks as server-only (`server-only` imports, `$lib/server`, `server/` directories, `.server.ts` files). A client-reachable import of one is a Blocker.
- **Config is read in one place.** Environment variables are validated once in a config module and imported from there. `process.env.X` scattered through the code is a finding.

## Components

- **One component per file**, named for what it renders.
- **Split by responsibility, not by size alone.** A component that fetches, transforms, and renders wants a data-owning parent and a presentational child.
- **Props in, events out.** A component does not reach into a global store for something its parent could pass, unless the repo's pattern is a context or provider for that data.
- **No prop drilling past two levels.** Use the framework's context or the repo's store pattern.
- **Reuse the repo's primitives.** A hand-rolled button, modal, or input next to the design system's version is a finding.

## Files and folders

- **Follow the framework's routing and special-file conventions exactly.** A wrong filename or export in a routing directory can break a route or the build (see the playbook).
- **Match the repo's organizing scheme.** Feature-first (`features/billing/...`) or type-first (`components/`, `lib/`, `services/`): extend whichever the repo uses. Never start a second scheme beside the first.
- **Colocate what changes together.** A feature's components, logic, and tests sit near each other when the repo allows it.
- **Promote to shared only on the second real consumer.** Code used by one feature lives in that feature. A shared folder full of single-use code is a finding.
- **No junk drawers.** A new `utils.ts`, `helpers.ts`, or `misc/` is a finding; name the module for its domain (`money.ts`, `dates.ts`, `slug.ts`).
- **Naming follows the repo:** its casing for files (kebab-case or PascalCase), its suffixes (`.server.ts`, `.test.ts`, `.spec.ts`), and its directory names.
- **No new top-level directory** without a clear need, and never as a side effect of a small task.
- **Barrel files (`index.ts` re-exports)** only where the repo already uses them. New barrels invite circular imports and defeat tree-shaking.
- **Tests live where the repo keeps tests**, mirroring the source layout.

## Dependencies between modules

- **No circular imports.** `fallow` reports them on JS and TypeScript repos; the architecture reviewer confirms them.
- **Features do not import each other's internals.** Share through a public entry or by promoting to shared.
- **One client per upstream.** A second fetch wrapper or database client for a service the repo already talks to is a finding; extend the existing one.

## Data contracts

- **Validate at every trust boundary** with the repo's schema library, and derive the types from the schema.
- **Type contracts end to end.** The shape a server returns and the shape the client expects come from one definition, not two hand-written copies.
- **Keep database shapes out of the UI.** Map rows to the domain or view model at the data layer, so a column rename does not ripple into components.
