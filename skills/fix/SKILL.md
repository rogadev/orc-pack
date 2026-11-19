---
name: fix
pack: orc-pack@2.4.0
description: Fixes what a review found by running /orc on its findings in this session, committing each fix. "/fix" takes the findings worth fixing this round, by best judgement; "/fix all" takes every Blocker, Warning, and Nit; "and push" at the end also pushes. For example "/fix", "/fix all", "/fix and push", or "/fix all but leave the debug page".
argument-hint: "[all] [<report path>] [and push] [<more instructions>]"
disable-model-invocation: true
---

# Fix

`/fix` runs `/orc` on a text request built from `$ARGUMENTS`: read the `orc` skill's `SKILL.md`, in the `orc` directory beside this skill's base directory (`<base>/../orc/SKILL.md`), and follow it exactly, with that request as its arguments. Its `references/` folder sits beside that file. Build the request from three parts, in this order:

1. **The scope.** When the first word is `all`, start with "Fix every finding in the review, at scope All"; otherwise, "Fix the review's findings at scope Best judgement". Orc's **Fixing review findings** section defines both.
2. **The report.** When the arguments hold a path to a review report, add "from the report at `<path>`".
3. **The rest** of the arguments, as the owner wrote them, for example `and push` or `but leave the debug page`. Where they narrow the scope, they win.

For example, `/fix all and push` runs orc with "Fix every finding in the review, at scope All, and push." Everything about the run is orc's; this file only builds the request.
