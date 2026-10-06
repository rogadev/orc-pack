# Work contract

Orc fills this in once per run, in **Make it buildable**, before it plans a single task. It is the run's definition of done: builders build to it, the `scope-reviewer` checks every diff against it, and the report maps each acceptance criterion to the test that proves it. Write it to `<scratchpad>/contract.md`, outside the repo.

Keep it proportionate. A one-file typo fix gets a three-line contract (restatement, one criterion, nothing out of scope). A feature gets every section. Never pad a section; delete one that has nothing to say, except **Integrations**, which always says "none" or lists them.

---

## Restatement

One sentence on what was asked, naming the exact files, components, routes, or symbols you believe it means: "Add a 30-second retry with backoff to `uploadToS3` in `src/lib/server/storage.ts`", not "add retries to uploads".

When a word in the request could mean more than one thing in this repo (a domain term, a component name that exists twice, a word like "specimen" that is both a model and a UI label), name the reading you chose and the evidence for it: the grep hits, the file that uses the term, the issue that introduced it.

## In scope

The changes this run makes, one line each, each traceable to the request or the issue.

Always in scope without being listed (pre-approved, never a scope finding):

- cleanup in the files the run touches, as `builder-contract.md` and `code.md` define it;
- code the change itself makes dead (an import, a helper, a test, a spec for removed behavior), deleted;
- a typo or an obviously wrong comment on a line the change sits next to.

## Out of scope

Tempting adjacent work, named so no one builds it by accident. One line each. Problems noticed while reading go here with their **Follow-up size** (Small, Medium, Large, or Huge): a Small one becomes its own task in this run through **Discoveries**, and orc then moves it to **In scope**, tagged `follow-up`, and a Medium or larger one becomes a card.

## Integrations

Every external system the work reads from or writes to (an HTTP API, a queue, an email or payment provider, a database other than the app's own, a third-party SDK), and for each: **real** or **mocked**, and where.

- **Real is the default.** Production code paths call the real integration, configured through the repo's existing env vars or secrets.
- **Mocks belong in tests**, at the boundary the repo's tests already mock. A mock, stub, or hard-coded response in a production code path is allowed only when the request asked for one, and then it is listed here as **MOCKED**, in capitals, with the reason.
- If the repo has no client, configuration, or environment variable for the real integration (a live call failing locally doesn't count), don't substitute a mock. Build what doesn't need it, and treat the missing access as orc's **NOT FINISHED** case for a missing credential, or a card when the rest of the work stands on its own.

## Assumptions

Each judgement call about user-facing behavior that the request didn't settle, written as the question and the answer you chose: "Can a user withdraw a vote after the poll closes? Assumed no: the close handler already locks the row." These go in the report's **Heads-up**, where the user can overturn them.

## Acceptance criteria

Three to six for a feature or bug fix, one or two for a trivial change. Each is an observable behavior, and each names the test that will prove it:

| #   | Criterion                                              | Test (file and name, or the check command)                              |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | A failed upload is retried up to 3 times with backoff. | `src/lib/server/storage.test.ts` "retries a failed upload with backoff" |
| 2   | A 4xx response is not retried.                         | `src/lib/server/storage.test.ts` "does not retry a client error"        |

A criterion the repo's tests can't express (a docs change, a config value, a repo with no test harness) names the concrete command or check that proves it instead. A cleanup run's criteria are its characterization tests passing unchanged.

The builder writes each named test first and confirms it fails for the right reason before it writes the change. A test that passes before the change proves nothing about it.
