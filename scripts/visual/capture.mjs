#!/usr/bin/env node
/**
 * Visual capture for agent review.
 *
 * Flattens a live page (and its motion) into artifacts an LLM can actually read:
 * still PNGs and text. Video and GIF are deliberately not produced - they cannot
 * be read back.
 *
 *   node scripts/visual/capture.mjs --url https://ascentra.finance --mode scan
 *   node scripts/visual/capture.mjs --mode film --on load --frames 9
 *   node scripts/visual/capture.mjs --mode film --on "hover:.lp-press"
 *   node scripts/visual/capture.mjs --mode motion --selector "h1" --ms 1200
 *
 * Modes:
 *   shot    one viewport screenshot (--full for the whole page)
 *   scan    viewport screenshots down the page, tiled into one contact sheet
 *   film    real animation frames via CDP screencast, tiled with timestamps
 *   motion  per-frame computed style samples as JSON (easing/duration evidence)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

// Vendored Chromium shared libs (see ensure-deps.sh) - needed where we cannot sudo.
const VENDOR_LIB = path.join(os.homedir(), ".cache", "claude-visual", "libs");
if (existsSync(VENDOR_LIB)) {
  const dirs = [
    path.join(VENDOR_LIB, "usr/lib/x86_64-linux-gnu"),
    path.join(VENDOR_LIB, "usr/lib"),
  ].join(":");
  process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
    ? `${dirs}:${process.env.LD_LIBRARY_PATH}`
    : dirs;
}

const DEFAULTS = {
  url: "http://localhost:4173/",
  mode: "shot",
  out: "scripts/visual/out",
  width: 1440,
  height: 900,
  frames: 9,
  cols: 3,
  ms: 1500,
  on: "load",
  selector: null,
  full: false,
  settle: 1200,
};

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "full") {
      opts.full = true;
      continue;
    }
    const value = argv[++i];
    if (value === undefined) throw new Error(`Missing value for --${key}`);
    opts[key] = /^\d+$/.test(value) ? Number(value) : value;
  }
  if (opts.mobile) {
    opts.width = 390;
    opts.height = 844;
  }
  return opts;
}

async function loadPlaywright() {
  // Kept out of the project tree on purpose: it is a review tool, not a build
  // dependency, and installs stay off the slow Windows mount.
  const candidates = [
    process.env.PLAYWRIGHT_HOME && path.join(process.env.PLAYWRIGHT_HOME, "node_modules/playwright/index.mjs"),
    path.join(os.homedir(), ".cache/claude-visual/node_modules/playwright/index.mjs"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return import(candidate);
  }
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      "playwright not found. Run: mkdir -p ~/.cache/claude-visual && cd ~/.cache/claude-visual && " +
        "npm init -y && npm i playwright && npx playwright install chromium",
    );
  }
}

/**
 * Tile frames into a single labelled contact sheet by rendering them in a blank
 * page and screenshotting that. Avoids depending on an image library.
 */
async function buildSheet(browser, frames, { cols, title, out }) {
  const cells = frames
    .map(
      (f) => `
      <figure>
        <img src="data:image/${f.type ?? "png"};base64,${f.data}" />
        <figcaption>${f.label}</figcaption>
      </figure>`,
    )
    .join("");

  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin:0; padding:20px; background:#111; font:500 13px ui-monospace,monospace; color:#eee; }
    h1 { font-size:14px; font-weight:600; margin:0 0 14px; color:#9ca3af; }
    .grid { display:grid; grid-template-columns:repeat(${cols},1fr); gap:14px; }
    figure { margin:0; }
    img { width:100%; display:block; border:1px solid #333; border-radius:4px; }
    figcaption { padding-top:5px; color:#9ca3af; }
  </style><h1>${title}</h1><div class="grid">${cells}</div>`;

  const page = await browser.newPage({
    viewport: { width: Math.min(460 * cols + 60, 1600), height: 900 },
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  const { chromium } = await loadPlaywright();
  await mkdir(opts.out, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: opts.width, height: opts.height },
    deviceScaleFactor: 1,
  });

  const label = `${opts.mode} ${opts.width}x${opts.height} ${opts.url}`;
  console.log(`> ${label}`);

  if (opts.mode === "film") {
    // Capture real frames off the compositor, then sample evenly across them.
    const client = await page.context().newCDPSession(page);
    const captured = [];
    let recording = false;
    let t0 = 0;

    client.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
      if (recording) {
        if (!t0) t0 = metadata.timestamp;
        captured.push({ data, ts: metadata.timestamp - t0 });
      }
      await client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    });

    const [action, target] = String(opts.on).split(":");

    if (action === "load") {
      await page.goto(opts.url, { waitUntil: "commit" });
      await client.send("Page.startScreencast", {
        format: "jpeg",
        quality: 75,
        maxWidth: 800,
        everyNthFrame: 1,
      });
      recording = true;
      await page.waitForTimeout(opts.ms);
    } else {
      await page.goto(opts.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(opts.settle);
      await client.send("Page.startScreencast", {
        format: "jpeg",
        quality: 75,
        maxWidth: 800,
        everyNthFrame: 1,
      });
      recording = true;
      if (action === "scroll") {
        await page.evaluate((sel) => {
          document.querySelector(sel)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, target);
      } else if (action === "hover") {
        await page.hover(target);
      } else if (action === "click") {
        await page.click(target);
      }
      await page.waitForTimeout(opts.ms);
    }

    recording = false;
    await client.send("Page.stopScreencast").catch(() => {});

    if (!captured.length) throw new Error("No frames captured - nothing animated?");

    const step = Math.max(1, Math.floor(captured.length / opts.frames));
    const picked = [];
    for (let i = 0; i < captured.length && picked.length < opts.frames; i += step) {
      picked.push({
        data: captured[i].data,
        type: "jpeg",
        label: `${Math.round(captured[i].ts * 1000)}ms`,
      });
    }

    const out = path.join(opts.out, "film.png");
    await buildSheet(browser, picked, {
      cols: opts.cols,
      title: `${opts.on} · ${captured.length} frames captured · ${label}`,
      out,
    });
    console.log(`  ${captured.length} frames -> ${picked.length} tiles: ${out}`);
  } else if (opts.mode === "scan") {
    await page.goto(opts.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(opts.settle);
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const steps = Math.min(opts.frames, Math.ceil(pageHeight / opts.height));
    const shots = [];
    for (let i = 0; i < steps; i++) {
      const y = i * opts.height;
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(650); // let scroll-triggered reveals settle
      shots.push({
        data: (await page.screenshot()).toString("base64"),
        label: `y=${y}`,
      });
    }
    const out = path.join(opts.out, "scan.png");
    await buildSheet(browser, shots, { cols: 2, title: label, out });
    console.log(`  ${steps} viewports: ${out}`);
  } else if (opts.mode === "motion") {
    if (!opts.selector) throw new Error("--mode motion requires --selector");
    await page.goto(opts.url, { waitUntil: "commit" });
    const samples = await page.evaluate(
      ({ selector, ms }) =>
        new Promise((resolve) => {
          const out = [];
          const start = performance.now();
          (function tick() {
            const el = document.querySelector(selector);
            const now = performance.now() - start;
            if (el) {
              const cs = getComputedStyle(el);
              out.push({
                t: Math.round(now),
                transform: cs.transform,
                opacity: cs.opacity,
                filter: cs.filter,
              });
            }
            if (now < ms) requestAnimationFrame(tick);
            else resolve(out);
          })();
        }),
      { selector: opts.selector, ms: opts.ms },
    );
    const out = path.join(opts.out, "motion.json");
    await writeFile(out, JSON.stringify({ selector: opts.selector, samples }, null, 2));
    console.log(`  ${samples.length} samples: ${out}`);
  } else {
    await page.goto(opts.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(opts.settle);
    const out = path.join(opts.out, "shot.png");
    await page.screenshot({ path: out, fullPage: opts.full });
    console.log(`  ${out}`);
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
