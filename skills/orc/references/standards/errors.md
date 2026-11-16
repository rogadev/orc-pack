# Error standard

`/orc` plans against this standard when a change adds or changes a call across a boundary, and the reviewers check it. It covers what `code.md`'s **Errors** section doesn't: which failures a call can have, and whether each one gets its own handling, message, and log. `code.md` still governs how errors are caught.

## Precedence

When two sources disagree, the higher one wins:

1. The repo's own docs (`CLAUDE.md`, `AGENTS.md`, ADRs, and any doc on an upstream: how it fails and what the product says when it does).
2. The repo's established error types, messages, and logging in the code around the change.
3. The framework and platform playbooks the review loaded for this repo.
4. This file.

The catalog below is a starting list, not a quota. Each provider and SDK names its errors differently and changes them between versions: check the installed version's error classes, status codes, and stop reasons before relying on a name here.

## The failure map

A **boundary** is any call whose result the code doesn't control: a model or AI provider, a third-party or internal API, an auth gateway or proxy, a database, a queue, the file system, or the browser's network. For each boundary a change adds or alters, the plan has a failure map with one row per failure mode:

| Failure                        | Detected by                  | User sees                                            | Logged as                   | Test                         |
| ------------------------------ | ---------------------------- | ---------------------------------------------------- | --------------------------- | ---------------------------- |
| Rate limited                   | 429, `retry-after`           | "Busy right now. Try again in a minute." and a retry | `warn ai.rate_limited`      | `suggest.rate-limit.test.ts` |
| Session expired at the gateway | 302, or 200 with `text/html` | "Your session expired." and a sign-in link           | `info auth.session_expired` | `suggest.session.test.ts`    |

- **One row per cause someone acts on differently.** Two causes share a row only when the user does the same thing about both and the log still tells them apart. "Something went wrong" for a rate limit, a blocked request, and an outage is three rows collapsed into one.
- **Unknown is a row.** The catch-all exists, shows a generic message with a reference ID, and logs at `error` with the raw status, code, and upstream request ID, so a failure nobody planned for shows up in the logs as unclassified and can get its own row.
- **A mode that can't happen for this call is left out,** not listed as handled. Note why when it isn't obvious (for example, the gateway is bypassed on this internal route).

## Rules

- **Classify once, at the boundary.** The code that makes the call turns upstream signals into one typed error (a discriminated union on `kind`, or the repo's error classes) before anything else sees them. Callers switch on the kind, never on status codes or message strings.
- **Check the response before parsing it.** Read the status and `content-type` first. A login page, a proxy's block page, or a gateway error page can arrive with status 200; parsed as data, it surfaces as a misleading "invalid JSON" or "empty result".
- **A message per kind.** Each says what happened and what to do next (retry, wait, rephrase, sign in again, contact support with the reference ID), in the product's voice, without blame, never the raw upstream text, and keeps the user's input. `ui.md` governs how it renders.
- **One structured log event per failure,** through the repo's logger: the kind, the boundary and operation, the upstream's status, error code, and request ID, the app's own request or correlation ID, the attempt number, and the duration. The level follows who must act: `info` for expected user-caused outcomes (a blocked prompt, a validation failure), `warn` for transient failures that were retried or recovered, `error` for the app's own bugs, unknown failures, and outages. Never log secrets, tokens, or prompts and response bodies that can hold personal data.
- **The reference ID the user sees is the one in the log,** so a support report leads to the event.
- **Retry only what can pass.** Timeouts, 429 (honouring `retry-after`), overloaded, and 5xx, with a limit and backoff. Never retry a 4xx that will repeat, and never retry a write that isn't idempotent unless it carries an idempotency key.
- **Every outbound call has a timeout,** and a timeout or abort is its own kind. A request the user cancelled (navigated away, pressed stop) shows no error.
- **Partial failure is its own row:** a stream cut off mid-response, or a batch where some items failed. Say what was kept.

## Catalog by boundary

**Model or AI provider.** Invalid or revoked key; quota or billing exhausted; rate limited; overloaded or provider outage (529, 503, other 5xx); timeout; request too large or context length exceeded; refused, or blocked by a safety or content filter (a stop reason, or a 400 with a policy code), which differs from output that fails the app's own validation; output truncated at the token limit; malformed output (unparseable JSON, a missing tool call, a schema mismatch); model not found or retired; stream interrupted. Behind an AI gateway, add the gateway's own rows: its rate limits, its policy blocks, and its own outage.

**Auth gateway, SSO, or reverse proxy** (PingFederate, Okta, an API gateway, a WAF). Session or token expired, showing as a redirect or an HTML login page, sometimes with status 200; not signed in (401) versus signed in but not allowed (403); blocked by a gateway or WAF policy (403, 406, or an HTML block page); gateway timeout (504), distinct from an error in the app behind it; in the browser, a CORS failure or opaque response, where `fetch` rejects with a `TypeError` and no status.

**HTTP API.** Network or DNS failure; timeout; 400 or 422 (the app sent a bad request: a bug, so `error`); 401 and 403; 404; 409 conflict; 429; 5xx; a 2xx with an unexpected body shape or a non-JSON body.

**Database.** Connection refused or pool exhausted; statement timeout; unique or foreign-key violation, often a user-facing conflict ("that name is taken"); serialization failure or deadlock, retried; row not found where one was expected.

**Files and uploads.** Too large; wrong type; storage unavailable; a write that half-finished.

**Browser.** Offline; a request aborted by navigation or the user.

## In review

- **A finding is a sample.** When one failure mode is missing, collapsed, or misread at a boundary, check every other mode in that boundary's catalog and every other call to the same boundary in the change, and report them together: one finding per boundary that lists its map, each row marked handled, missing, collapsed, or misread. Never report one gap and leave the rest for the next round.
- **A missing-row finding is concrete:** the upstream signal, what the code does with it today (the line that handles it, or the catch that swallows it), and what the user sees and the log records as a result.
- **Severity.** A Warning by default. A Blocker when the gap loses the user's input or data, gives guidance that sends them the wrong way on a primary flow (an expired session shown as "no results"), or hides a security failure (a 403 shown as success).
- **Not a finding:** a mode that can't happen for this call; causes the user acts on the same way sharing one message while the log tells them apart; a repo doc that accepts generic messages for an internal tool.
- **Ownership:** the quality lane owns classification, retries, and logging; the test-coverage lane owns a test per row; the UI lane owns how each message renders.
