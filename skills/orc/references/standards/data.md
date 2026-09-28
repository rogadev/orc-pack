# Data standard

Schema changes, migrations, backfills, indexes, and the queries that run against them. The `data-implementer` writes to this standard, as does any other builder whose task touches schema, migrations, or queries; the `design-reviewer` checks data briefs against it, and the `architecture-reviewer` checks diffs that touch schema or migrations.

## Precedence

When two sources disagree, the higher one wins:

1. The repo's own docs (`CLAUDE.md`, `AGENTS.md`, contributing guides, ADRs, runbooks).
2. The conventions of the repo's migration tool and data layer: file naming, generation workflow, how it expresses up and down steps.
3. The repo's established patterns in existing migrations, schema files, and queries.
4. The framework and platform playbooks orc loaded for this repo.
5. This file.

Never reshape a repo's data layer to match this file; raise the disagreement in the report instead. Engine behavior (locking, online operations, transactional DDL) differs by engine and version, so every rule here that depends on it means "check your engine's docs for the installed version", not one engine's rules.

## The bar

A data change is safe to deploy while the old code is still running, safe to re-run after it fails halfway, and safe to roll back. A reviewer should be able to read the migration and state what it locks, how long it runs on the largest table it touches, and what happens to the running app at each step. When that cannot be stated, the change is not done.

## Migrations

- **Use the repo's migration tool and its naming.** Generate the file the way the repo does (for example through the tool's generate command) rather than hand-writing one the tool would produce. A migration outside the tool's directory or naming scheme is a finding.
- **One logical change per migration.** Adding a table and reworking an unrelated index in one file is a finding; split it.
- **Never edit a migration that has shipped.** Once a migration may have run anywhere beyond a developer's machine, a fix is a new migration. Editing or deleting a shipped migration is a Blocker.
- **Reversible where the tool supports it.** The down path restores the prior shape: the same columns, types, nullability, defaults, constraints, and indexes. A down step that is empty, only partial, or throws without saying why is a finding. When a change genuinely cannot be reversed (for example it discards data), the migration says so explicitly in the tool's way.
- **Schema and data changes are separate** where the tool allows it. Structure goes in one migration, data movement in its own migration or a backfill (see **Backfills**).
- **Schema source and migrations agree.** When the repo keeps a schema file, generated types, or a snapshot beside the migrations, the diff updates them together.

## Live changes (expand and contract)

Assume the old version of the app keeps running against the new schema during a deploy, and the new version may run against the old schema during a rollback.

- **Expand, migrate, contract.** Add the new shape first, backfill it, switch writers and then readers to it, and remove the old shape in a later release. Each step is its own change.
- **Never rename or drop in one step** a column or table that live traffic reads or writes. A rename is add, backfill, switch, then drop later. A one-step rename or drop of something in use is a Blocker.
- **New non-null columns get a default or a backfill first.** Adding a non-null column with no default to a table with rows fails or locks; add it nullable or with a default, backfill, then tighten the constraint.
- **Constraints go on after the data satisfies them.** Where the engine supports adding a constraint without validating existing rows and validating it later, prefer that on large tables.
- **The deploy order is stated.** The brief and the report say whether the migration runs before or after the code deploys, and why each version of the code works against each schema state it will meet.

## Locks and large tables

- **Know what each operation locks** on the repo's engine and version. Check your engine's docs; do not assume. A migration on a large or hot table with no statement of its locking behavior is a finding.
- **Prefer online or concurrent operations** where the engine offers them, most often for index builds. Some of these cannot run inside a transaction; follow the migration tool's way of opting out.
- **Avoid table rewrites on big tables.** Type changes, some default changes, and column reordering can rewrite every row; check whether the operation rewrites on this engine before using it.
- **Keep transactions short.** A migration that holds locks while it does slow work (a large update, an index build, a call out of the database) is a finding. Set a lock or statement timeout where the repo's tooling supports one, so a blocked migration fails instead of stalling traffic.

## Backfills

- **Separate from the schema migration.** A backfill runs as its own migration, job, or script in the repo's established place for them, never inside the migration that changes the structure.
- **Batched.** Work in bounded chunks keyed on an indexed column. One unbounded `UPDATE` or `DELETE` across a whole table is a finding.
- **Idempotent and resumable.** Re-running after a partial failure produces the same result and picks up where it stopped. A backfill that double-applies, or has to start over, is a finding.
- **Throttled.** Batches are sized and paced so the backfill does not starve live traffic or overload replication.
- **Observable.** It reports progress and the count of rows changed, so whoever runs it knows when it is done.

## Indexes

- **Each index serves a real query.** It matches that query's filter, join, and sort columns, in an order the query can use. Name the query in the brief or report.
- **No speculative indexes.** An index added "just in case" or on every foreign key by reflex, with no query that needs it, is a finding.
- **Check for an existing index first.** A new index whose columns are the leading columns of an existing one is usually redundant.
- **Note the write cost.** Every index slows writes and takes space. On a write-heavy table, say why the read win is worth it.
- **Build large indexes online** (see **Locks and large tables**).

## Query safety

- **Parameterized queries only.** Input never reaches SQL through string concatenation or interpolation. Use the data layer's query builder or bound parameters. String-built SQL with any external input is a Blocker.
- **Go through the repo's data layer.** A raw query where the repo has a data layer, repository, or query builder for that table is a finding unless the data layer cannot express the query, and then the code says why.
- **No N+1.** A query per item inside a loop is a finding; batch, join, or use the data layer's relation loading.
- **Bounded result sets.** A query that can return an unbounded number of rows to the app paginates or limits. Prefer keyset pagination over large offsets on big tables where the repo's patterns allow it.
- **Select what you use.** No `SELECT *` or full-row fetches to read two columns.
- **Transactions sized to the work.** Group writes that must succeed together in one transaction; keep network calls, file I/O, and user-facing waits out of it.

## Destructive operations and environments

- **No destructive change unless the task asks for it.** Dropping a table or column, truncating, or deleting data happens only when the task explicitly requires it, and the report names it.
- **Only local and test databases.** Nothing in a task runs a migration, backfill, seed, or query against any database other than a local or test one. Connection strings for shared, staging, or production databases are never used, even read-only. Running changes against those environments is the deploy process's job, not the builder's.
- **Seeds stay out of production paths.** Seed and fixture data loads only in development and test, never from a migration or startup path that production runs.
- **No real personal data in seeds or fixtures.** Never copy rows from a real database into the repo. Use generated or obviously fake values.

## AI slop in data code

These are the signatures of data changes written to look finished rather than to be right. Each is a finding.

1. **Hand-written migration the tool generates.** A migration written by hand that duplicates what the repo's migration tool would generate, and drifts from the schema source.
2. **Guessed columns.** A column whose type, length, nullability, or default was guessed rather than derived from the domain and the existing schema's conventions.
3. **Just-in-case indexes.** An index with no query that needs it (see **Indexes**).
4. **Backfill inside the schema migration.** Data movement bundled into the structure change (see **Backfills**).
5. **Bypassing the data layer.** A raw query or a second database client next to the repo's existing data layer (see **Query safety**).
6. **Decorative down steps.** A down migration that exists but does not restore the prior shape.
7. **Unbounded operations.** A full-table `UPDATE` or `DELETE`, or a query with no limit on a table that grows.
8. **Duplicate shapes.** A type or model re-declared by hand when the data layer generates or infers it.
9. **Silent destructive steps.** A drop, truncate, or data-deleting statement tucked into a migration with no mention in the brief or report.

## What is not a finding

- A migration style, naming scheme, or data-layer pattern the repo uses consistently, even if you would choose another.
- A missing down step when the repo's tool or convention is forward-only.
- A one-step schema change on a table with no live traffic yet (for example a table added in the same unreleased change).
- Index or query tuning with no measured or obvious cost.

A finding names a concrete cost: data loss, downtime or lock contention, a failed or unrepeatable deploy, a security hole, a real performance problem, or a documented rule broken.
