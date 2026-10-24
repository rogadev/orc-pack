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
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", (r) => {
      if (r.url().startsWith(baseUrl) && r.status() >= 400)
        errors.push(`${r.status()} ${r.url()}`);
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
