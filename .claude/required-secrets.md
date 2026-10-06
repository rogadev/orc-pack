# Required secrets

orc-pack has no deployed environment and no repository or environment secrets. Both workflows run on the `GITHUB_TOKEN` that GitHub Actions provides to every run, so there is nothing for shipcheck to look for. Checked on 2026-10-06: `gh secret list` and the repo's environments list are both empty.

## CI

Target: github-actions

None. `release-guard.yml` and `pack-integrity.yml` use only the built-in `GITHUB_TOKEN`; `release-guard.yml` raises its permission to `contents: write` to commit fixes, tag, and publish the release. If a workflow ever reads `secrets.<NAME>`, list it here.
