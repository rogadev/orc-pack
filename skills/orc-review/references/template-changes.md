# Review template changes

**Current review template: 4.**

The review template is `profile-template.md` and `lane-template.md` together: the shape of a project's profile and of its repo lanes. Its number moves only when a change would make an existing profile or lane read differently or miss something, which is rare; pack releases that change anything else leave it alone. It is not the pack version.

A profile records two numbers in its frontmatter:

- `template: <n>` — the template version the profile and its repo lanes were last built or refreshed to. A refresh applies the notes after this number.
- `template-reviewed: <n>` — the latest template version the user has decided on, by refreshing or by `/orc-review setup skip`. `/orc-review` suggests a refresh only when the current template is greater than both.

**A profile with no `template:` line** predates these numbers: take its number from its `based-on: orc-review@<version>` line (before 1.20.0 is 1, 1.20.x is 2, 1.21.x is 3), and treat `template-reviewed` as the same number.

Each section below lists, for one template version, what an existing profile or lane needs, so a refresh carries it over instead of guessing. Every item has an id (`<n>.<k>`) that the profile's **Declined template changes** section can name. Read them oldest first, starting after the profile's `template` number.

## Template 2 (orc-review 1.20.0)

**Summary:** sections for checks, platform constraints, and repo lanes; labelled risk-map rows; a fixed Extra focus format.

- **2.1 Checks:** move check commands written in prose into the **Checks** table (`always`, a path condition, or `remind`), and list commands that write under **Never run**.
- **2.2 Platform constraints:** move deploy facts (upstream timeouts, replica count, gateway behaviour, body limits) into **Platform constraints**, from wherever the profile or its lanes wrote them.
- **2.3 Repo lanes:** list each project-owned lane under **Repo lanes** with its **Owns**, **Runs when**, and **Standards**, moving a bracketed run condition out of an **Extra lanes** cell into **Runs when**. Rewrite each lane to `lane-template.md` rather than prepending an adapter.
- **2.4 Labelled rows:** a labelled risk-map row such as `Logic (client)` now only attaches its repo lanes and no longer classifies files. For each labelled or non-standard row, name the paths whose surface changes, and add an unlabelled row where the user wants the old surface kept. Report every surface change.
- **2.5 Extra focus:** turn bold lane lead-ins into `### <lane>[, <lane>]: <topic>` headings, with optional `Paths:` and `Reference:` lines.
- **2.6 Workflow additions:** move steps the profile added after the review into **After verification**, and a saved-report folder or ledger command into **Report destination**.

## Template 3 (orc-review 1.21.0)

**Summary:** an install check for range worktrees, an optional Default mode, fixed severities in Extra focus, and lanes that read the range's own tree.

- **3.1 Install check:** add an `install` row to **Checks** (When `worktree`) with the repo's frozen install, from the lockfile's package manager.
- **3.2 Default mode:** offer an optional **Default mode** line under **Stack** (`quick`, `full`, or a size rule such as `quick below 5 files`); suggest it when a typical change runs more than eight lanes.
- **3.3 Framework conventions:** keep a glob for a framework file convention the repo hasn't used yet, marked `(none yet)`, instead of dropping it.
- **3.4 Fixed severities:** an Extra focus bullet may start with `Blocker:` or `Warning:` to fix that rule's severity; offer it for rules the user treats as release blockers.
- **3.5 Repo lanes `always`:** a **Runs when** of `always` means whenever one of the lane's risk-map rows matches; rewrite a blank cell or an equivalent condition to it.
- **3.6 Lane brief and report:** rewrite each repo lane's **Your brief** and **Report** to the current `lane-template.md`: it reads code in `Tree` when present, `Project` and `Ownership` arrive as files, it cites lines in the file, never in the diff, calls only added lines introduced, names unread files under `Not read:`, and honours a fixed severity. Delete facts the profile's Platform constraints or Architecture hold from the lane body.
- **3.7 Local workarounds:** remove patches a profile or lane added for 1.20.0's gaps (a **Local workarounds** or **Workflow notes** section, `Tree:` and `Base:` paragraphs, line-number rules) that this template now covers, and keep any it doesn't.

## Template 4 (orc-review 1.22.0)

**Summary:** repo lanes write their findings to a report file and reply with one line, so the verifier reads them and orc-review never relays them.

- **4.1 Report file:** give each repo lane the `Write` tool, limited in its **Read-only** paragraph to the brief's `Report` file, add `Report` to **Your brief**, and rewrite its **Report** section to the current `lane-template.md`: findings go to the file, and the reply is one line with the counts and the path. A lane left as it is still works: orc-review passes its reply to the verifier, at the cost of the orchestrator copying the findings.
