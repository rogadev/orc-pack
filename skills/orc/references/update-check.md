# Update check

Tells the user, in one report line, when a newer orc-pack release exists. It runs once per report, never updates anything, never asks, and never blocks or fails a run. `/orc`, `/orc-loop`, `/orc-rush`, and `/orc-review` run it just before their report; the per-issue `/orc` runs inside a loop skip it, so a batch reports it once.

## Steps

1. **Installed version.** The `pack: orc-pack@x.y.z` marker on line 3 of the running skill's `SKILL.md`. Every pack skill carries the same version, in a copied install and in a plugin's cache alike.
2. **Install kind.** A plugin install when the skill's base directory is under `.claude/plugins/`; otherwise a copied install.
3. **Source repo.** The `owner/repo` recorded in `.claude/orc-pack.provenance.md` (or `~/.claude/orc-pack.provenance.md`), else `rogadev/orc-pack`.
4. **Latest version, cached for a day.** The cache is `$(git rev-parse --git-common-dir)/orc-pack/update-check`, one line: `<UTC ISO time checked> <latest tag>`. When it was written under 24 hours ago, use its tag. Otherwise fetch the latest release's tag, with `gh api repos/<owner/repo>/releases/latest --jq .tag_name`, or, when `gh` is missing or fails, `curl -fsS --max-time 10 https://api.github.com/repos/<owner/repo>/releases/latest` and its `tag_name`. On success, create the folder if needed and rewrite the cache.
5. **Compare.** Strip a leading `v` and compare semver. Report only when the latest is greater than the installed version. An install ahead of the latest release (a maintainer's `dev` checkout) is not out of date.

If any step fails (offline, rate-limited, no `gh` or `curl`, no marker, no git directory), drop the check silently: no report line, no cache write, and no mention as a step that didn't run.

## The report line

Put it last under the report's **Heads-up** (for `/orc-rush`, last under `## Next`; for `/orc-review`, last under **Needs your attention**), filling in the versions and the release URL `https://github.com/<owner/repo>/releases/tag/<tag>`:

- **Copied install:** `orc-pack <latest> is out; this run used <installed> (<release URL>). Run /update-orc in a new session to update.`
- **Plugin install:** `orc-pack <latest> is out; this run used <installed> (<release URL>). Run /plugin update orc-pack@orc-pack, or turn on auto-update for the orc-pack marketplace under Marketplaces in /plugin.`

Never run `/update-orc` or a plugin update yourself: an update rewrites the pack's files and is the user's to start.
