# Smoke checklist

orc-pack is Markdown prompt content with no web surface, so there are no browser flows. It ships as a GitHub release: merging `dev` into `main` runs the release guard, which may push a version-sync commit onto `main` and then tags `vX.Y.Z` and publishes the release that plugin users and `/update-orc` read.

## Deploy

URL: none
Environment: GitHub releases (pushes to `main` only; a push to `dev` deploys nothing)
Live commit: `gh release view v<version in .claude-plugin/plugin.json> --json tagName,targetCommitish`, then the tag's commit (`git rev-list -n 1 v<version>` after `git fetch --tags`) must be the pushed SHA or a release-guard commit whose parent is the pushed SHA. The release body must equal the `## [<version>]` section of `CHANGELOG.md`.
Timeout: 10 minutes
