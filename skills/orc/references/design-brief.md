# Design brief template

For structural tasks, the implementer writes this brief before writing code, and the `design-reviewer` approves it or sends it back. Keep it short: a brief that takes longer to read than the diff will is too long. Omit a section that does not apply, but never omit **Placement** or **Reuse**.

```markdown
# Design brief: <task title>

## Goal

<One or two sentences: what the task delivers, quoting the acceptance criteria it serves.>

## Placement

| File           | New or changed | Layer  | Why here                                                      |
| -------------- | -------------- | ------ | ------------------------------------------------------------- |
| `path/to/file` | new            | domain | <one line: why this location, citing the neighbor it mirrors> |

## Reuse

- <Existing module, component, helper, or type this builds on, with its path.>
- <Anything similar that already exists, and why it is extended rather than duplicated.>

## Data flow

<Where data enters, where it is validated, which layer transforms it, and where it is rendered or stored. Mark the server and client boundary. Name the framework mechanism used for loading and for mutation.>

## Contracts

<New or changed types, schemas, function signatures, props, endpoints, or events, with their shapes. Say which is the single source of truth for each shape.>

## UI (only when the task touches UI)

- **Where it lives:** <route and parent layout or component>
- **Built from:** <design-system primitives and tokens used>
- **States:** loading, empty, error, success, disabled, and long content, one line each on how each looks and behaves
- **Responsive:** <what changes at narrow and wide widths>
- **Accessibility:** <keyboard flow, focus management, names, announcements>
- **Copy:** <button labels, headings, empty and error messages>

## Tests

<What gets tested at which tier, including the edge and error paths.>

## Risks and open decisions

<Anything a reviewer should weigh, and the choice made for each. "None" is a valid answer.>
```
