#!/usr/bin/env node
// Compares an installed orc pack with the kit it came from, file by file, so an install,
// update, or setup proves the result instead of describing it. It reads both trees and writes
// nothing.
//
// Usage: node check-install.mjs <kitDir> <installRoot> [--allow <path>]... [--declined <path>]...
//
// <kitDir> is a checkout of the pack at the target version (it holds skills/ and agents/).
// <installRoot> is the .claude/ directory the pack was copied into.
// --allow names a file (relative to <installRoot>, for example skills/orc/SKILL.md) that keeps
// a recorded local edit, so a difference there is reported as preserved, not as a failure.
// --declined names a skill directory or agent file the user chose not to install (for example
// skills/shipcheck or agents/fallow.md), so its absence is reported, not failed.
//
// Exit code 0 means the install matches the kit apart from the allowed and declined paths;
// 1 means something is missing, different, or stale; 2 means bad arguments.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const allow = new Set();
const declined = [];
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--allow") allow.add(norm(args[++i] ?? ""));
  else if (args[i] === "--declined")
    declined.push(norm(args[++i] ?? "").replace(/\/$/, ""));
  else positional.push(args[i]);
}
if (positional.length !== 2) {
  console.error(
    "Usage: node check-install.mjs <kitDir> <installRoot> [--allow <path>]... [--declined <path>]...",
  );
  process.exit(2);
}
const [kitDir, installRoot] = positional.map((p) => path.resolve(p));
for (const dir of [path.join(kitDir, "skills"), path.join(kitDir, "agents")]) {
  if (!fs.existsSync(dir)) {
    console.error(`Not a kit checkout: ${dir} is missing.`);
    process.exit(2);
  }
}

function norm(p) {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

function walk(root, sub) {
  const out = [];
  const base = path.join(root, sub);
  if (!fs.existsSync(base)) return out;
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const rel = `${sub}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(root, rel));
    else out.push(rel);
  }
  return out;
}

// Line endings differ between checkouts on Windows; content is what has to match.
function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function hasMarker(text) {
  return /^pack: orc-pack@/m.test(text.split("\n").slice(0, 12).join("\n"));
}

const isDeclined = (rel) =>
  declined.some((d) => rel === d || rel.startsWith(`${d}/`));

const kitFiles = [...walk(kitDir, "skills"), ...walk(kitDir, "agents")].sort();
const kitSet = new Set(kitFiles);
const kitSkills = [
  ...new Set(
    kitFiles.filter((f) => f.startsWith("skills/")).map((f) => f.split("/")[1]),
  ),
];

const result = {
  match: [],
  missing: [],
  differ: [],
  repoOwned: [],
  preserved: [],
  declined: [],
  stale: [],
};

for (const rel of kitFiles) {
  const target = path.join(installRoot, rel);
  if (isDeclined(rel)) {
    result.declined.push(rel);
    continue;
  }
  if (!fs.existsSync(target)) {
    result.missing.push(rel);
    continue;
  }
  const have = read(target);
  if (have === read(path.join(kitDir, rel))) result.match.push(rel);
  else if (allow.has(rel)) result.preserved.push(rel);
  else if (/(SKILL|agents\/[^/]+)\.md$/.test(rel) && !hasMarker(have))
    result.repoOwned.push(rel);
  else result.differ.push(rel);
}

// Stale: a pack-marked skill or agent the kit no longer ships, or a file in a pack skill's
// references/ directory that the kit dropped.
for (const rel of [
  ...walk(installRoot, "skills"),
  ...walk(installRoot, "agents"),
]) {
  if (kitSet.has(rel)) continue;
  const parts = rel.split("/");
  const inPackRefs =
    parts[0] === "skills" &&
    kitSkills.includes(parts[1]) &&
    parts[2] === "references";
  const marked =
    rel.endsWith(".md") && hasMarker(read(path.join(installRoot, rel)));
  if (inPackRefs || marked) result.stale.push(rel);
}

// Personal skills outrank project skills of the same name in Claude Code, so a stale or
// hand-made copy in ~/.claude/skills/ runs instead of the project's for this user.
const shadows = [];
const personal = path.join(os.homedir(), ".claude");
if (path.resolve(installRoot) !== path.resolve(personal)) {
  for (const name of kitSkills) {
    const mine = path.join(personal, "skills", name, "SKILL.md");
    const kit = path.join(kitDir, "skills", name, "SKILL.md");
    if (!fs.existsSync(mine) || !fs.existsSync(kit)) continue;
    const text = read(mine);
    if (text !== read(kit)) {
      const why = hasMarker(text)
        ? `pack ${text.match(/pack: orc-pack@(\S+)/)[1]}`
        : "no pack marker";
      shadows.push(`skills/${name}/SKILL.md (${why})`);
    }
  }
}

const version = (() => {
  const f = path.join(kitDir, ".claude-plugin", "plugin.json");
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")).version;
  } catch {
    return "unknown";
  }
})();

const section = (title, list, note = "") => {
  if (!list.length) return;
  console.log(`\n${title} (${list.length})${note}`);
  for (const item of list) console.log(`  ${item}`);
};

console.log(`orc-pack install check: kit ${version}, install ${installRoot}`);
console.log(
  `${result.match.length} match, ${result.missing.length} missing, ${result.differ.length} different, ` +
    `${result.repoOwned.length} repo-owned at a pack name, ${result.stale.length} stale, ` +
    `${result.preserved.length} preserved, ${result.declined.length} declined`,
);
section("Missing", result.missing, ": copy from the kit");
section(
  "Different",
  result.differ,
  ": overwrite from the kit, or pass --allow for a recorded local edit",
);
section(
  "Repo-owned at a pack name",
  result.repoOwned,
  ": replace with the kit's file and move project facts to the profile or CLAUDE.md",
);
section("Stale", result.stale, ": the kit no longer ships these; remove them");
section("Preserved local edits", result.preserved);
section("Declined by the user", result.declined);
section(
  "Shadowed for you",
  shadows,
  ": your ~/.claude/skills/ copy runs instead of the project's; refresh it with /update-orc there, or remove it",
);

const failed =
  result.missing.length +
  result.differ.length +
  result.repoOwned.length +
  result.stale.length;
console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
