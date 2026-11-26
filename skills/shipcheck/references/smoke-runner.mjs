// Shipcheck smoke runner template. Copy it to the scratchpad, replace FLOWS with
// the checklist's flows, then run:
//   node smoke-runner.mjs <repoRoot> <baseUrl> <outDir> [themeStorageKey]
// Playwright loads from <repoRoot>/node_modules, so nothing is installed.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [repoRoot, baseUrl, outDir, themeKey] = process.argv.slice(2);
const { chromium, devices } = createRequire(join(repoRoot, "package.json"))(
  "playwright",
);
mkdirSync(outDir, { recursive: true });

const phone = {
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
};
const desktop = { viewport: { width: 1440, height: 900 } };

// The app's own requests: the base URL's origin, under its path when it has one. A string prefix
// would also take a lookalike host (https://app.example.com.cdn.net) or a sibling path (/app-other).
const base = new URL(baseUrl);
const basePath = base.pathname.replace(/\/+$/, "");
const inApp = (url) => {
  try {
    const u = new URL(url);
    return (
      u.origin === base.origin &&
      (!basePath ||
        u.pathname === basePath ||
        u.pathname.startsWith(`${basePath}/`))
    );
  } catch {
    return false;
  }
};

// Base64 with a `+`, `/`, or `=` is a secret when some stretch between slashes is long and mixes
// digits with upper- and lowercase letters.
const randomish = (m) =>
  /[+/=]/.test(m) &&
  m
    .split("/")
    .some(
      (p) =>
        p.length >= 16 && /\d/.test(p) && /[a-z]/.test(p) && /[A-Z]/.test(p),
    );

// Failing URLs and console errors can carry a credential, in a URL or in the error text, and
// results.json and the log keep them. Drop each URL's query and fragment, then mask what looks
// like a credential, with the rules /retro's usage.mjs uses (keep the two in step). One rule
// differs: any long string is masked here, even after a `/`, and even a SHA, a UUID, or a long
// word-joined identifier, because a reset or invite link can carry its token in the path.
// usage.mjs keeps those so file paths, session ids, and tool names stay readable.
const scrub = (s) =>
  String(s)
    .replace(/(https?:\/\/[^\s?#"'<>]+)[?#][^\s"'<>]*/g, "$1")
    .replace(/https?:\/\/[^\s"'<>]+/g, (u) =>
      u.replace(/\/[A-Za-z0-9_-]{32,}(?=\/|$)/g, "/[redacted]"),
    )
    .replace(/(authorization:\s*(bearer|basic)\s+)\S+/gi, "$1[redacted]")
    .replace(
      /\b(password|passwd|secret|token|api[-_]?key|access[-_]?key)(\s*[=:]\s*)\S+/gi,
      "$1$2[redacted]",
    )
    .replace(/\/\/[^/\s:@]+:[^/\s@]+@/g, "//[redacted]@")
    .replace(
      /\b(sk|pk|rk|ghp|gho|ghs|ghu|github_pat|xox[abprs]|AKIA|ASIA|npm)[-_A-Za-z0-9]{8,}/g,
      "[redacted]",
    )
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[redacted]")
    .replace(/(?<![\w+/-])(?!\/)[A-Za-z0-9+/]{32,}={0,2}(?![\w+/=-])/g, (m) =>
      randomish(m) ? "[redacted]" : m,
    )
    .replace(/(?<![\w-])[A-Za-z0-9_-]{32,}(?![\w-])/g, "[redacted]");
const PASSES = [
  { name: "390-light", ctx: phone, theme: "light" },
  { name: "390-dark", ctx: phone, theme: "dark" },
  { name: "1440-light", ctx: desktop, theme: "light" },
  { name: "1440-dark", ctx: desktop, theme: "dark" },
];

// One entry per checklist flow. `check` performs the steps after the page loads
// and returns facts to record; throw (or let a locator time out) when an
// Expect line fails. Keys named `ok*` must be true for the flow to pass.
const FLOWS = [
  {
    name: "home",
    path: "/",
    check: async (page) => ({
      okHeading: await page.locator("h1").first().isVisible(),
    }),
  },
];

const browser = await chromium.launch();
const results = [];
for (const pass of PASSES) {
  const context = await browser.newContext({
    ...pass.ctx,
    colorScheme: pass.theme,
  });
  if (themeKey) {
    await context.addInitScript(
      ([k, t]) => localStorage.setItem(k, t),
      [themeKey, pass.theme],
    );
  }
  for (const flow of FLOWS) {
    const page = await context.newPage();
    const errors = [];
    page.on(
      "console",
      (m) => m.type() === "error" && errors.push(scrub(m.text())),
    );
    page.on("pageerror", (e) => errors.push(scrub(String(e))));
    page.on("response", (r) => {
      if (inApp(r.url()) && r.status() >= 400)
        errors.push(`${r.status()} ${scrub(r.url())}`);
    });
    const row = { pass: pass.name, flow: flow.name };
    try {
      await page.goto(baseUrl + flow.path, { waitUntil: "networkidle" });
      Object.assign(row, await flow.check(page));
      Object.assign(
        row,
        await page.evaluate(() => ({
          width: innerWidth,
          hscroll: document.documentElement.scrollWidth > innerWidth,
          brokenImages: [...document.images].filter(
            (i) => i.complete && i.naturalWidth === 0,
          ).length,
        })),
      );
    } catch (e) {
      row.failure = String(e).split("\n")[0];
    }
    row.errors = errors;
    row.screenshot = join(outDir, `${pass.name}-${flow.name}.png`);
    await page.screenshot({ path: row.screenshot }).catch(() => {});
    results.push(row);
    await page.close();
  }
  await context.close();
}
await browser.close();

writeFileSync(join(outDir, "results.json"), JSON.stringify(results, null, 2));
let failed = 0;
for (const r of results) {
  const notOk = Object.entries(r)
    .filter(([k, v]) => k.startsWith("ok") && v !== true)
    .map(([k]) => k);
  const bad =
    r.failure || r.errors.length || r.hscroll || r.brokenImages || notOk.length;
  if (bad) failed++;
  const detail = [
    r.failure,
    notOk.length && `not ok: ${notOk}`,
    r.errors.length && `errors: ${JSON.stringify(r.errors)}`,
    r.hscroll && "horizontal scroll",
    r.brokenImages && `${r.brokenImages} broken images`,
  ]
    .filter(Boolean)
    .join("; ");
  console.log(
    `${bad ? "FAIL" : "ok  "} ${r.pass.padEnd(10)} ${r.flow.padEnd(16)} width=${r.width ?? "?"} ${detail}`,
  );
}
process.exit(failed ? 1 : 0);
