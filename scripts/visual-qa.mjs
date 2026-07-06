/**
 * Visual QA: screenshots pages in dark + light themes using the system Chrome
 * and reports any browser console errors.
 *
 *   node scripts/visual-qa.mjs [baseUrl] [outDir]
 *
 * Defaults: baseUrl=http://localhost:3000, outDir=./qa-shots
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const outDir = process.argv[3] ?? "./qa-shots";
mkdirSync(outDir, { recursive: true });

function findChrome() {
  for (const bin of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try {
      return execFileSync("which", [bin], { encoding: "utf8" }).trim();
    } catch {
      /* try next */
    }
  }
  throw new Error("No Chrome/Chromium found on PATH");
}

const PAGES = [
  { path: "/", name: "home", height: 2800, settle: 6000 },
  { path: "/markets", name: "markets", height: 1400, settle: 4000 },
  { path: "/learn", name: "learn", height: 1200, settle: 2000 },
  { path: "/terminal", name: "terminal", height: 900, settle: 8000, themes: ["dark"] },
];

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

const errors = [];
for (const spec of PAGES) {
  for (const theme of spec.themes ?? ["dark", "light"]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: spec.height });
    // next-themes reads localStorage("theme") before paint
    await page.evaluateOnNewDocument((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
    }, theme);
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`[${spec.name}/${theme}] console.error: ${msg.text().slice(0, 300)}`);
      }
    });
    page.on("pageerror", (err) => {
      errors.push(`[${spec.name}/${theme}] pageerror: ${String(err).slice(0, 300)}`);
    });
    try {
      await page.goto(baseUrl + spec.path, { waitUntil: "networkidle2", timeout: 30000 });
    } catch {
      // networkidle may never fire on pages with live websockets — continue
    }
    await new Promise((r) => setTimeout(r, spec.settle));
    await page.screenshot({ path: `${outDir}/${spec.name}-${theme}.png` });
    console.log(`✓ ${spec.name} (${theme})`);
    await page.close();
  }
}

await browser.close();

if (errors.length) {
  console.log("\n--- console/page errors ---");
  for (const e of errors) console.log(e);
  process.exitCode = 2;
} else {
  console.log("\nNo browser console errors.");
}
