#!/usr/bin/env node
/**
 * Render a tailored resume.md to a single-column PDF with a selectable text layer.
 *
 *   node render_pdf.mjs applications/<slug>/resume.md [-o out.pdf] [--open]
 *
 * Parses the constrained resume grammar defined in resume-tailor/SKILL.md rather than
 * general markdown, so each construct maps to a known semantic element and the layout
 * stays under our control.
 */

import { readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import puppeteer from "puppeteer-core";
import { parseResume } from "./parse_resume.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const TEMPLATE_DIR = path.join(HERE, "..", "template");

/* ------------------------------------------------------------------ args */

function parseArgs(argv) {
  const args = { input: null, out: null, open: false, html: false, letter: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--out") args.out = argv[++i];
    else if (a === "--open") args.open = true;
    else if (a === "--html") args.html = true; // dump intermediate HTML, for template work
    else if (a === "--letter") args.letter = true;
    else if (a === "--resume") args.letter = false; // override the filename sniff
    else if (a === "-h" || a === "--help") args.help = true;
    else if (!args.input) args.input = a;
  }
  return args;
}

/** Page count read from the produced PDF, which is the only number that reflects
 *  real pagination. Chrome writes an uncompressed page tree, so the leaf /Type /Page
 *  objects are countable; returns null if that ever stops being true. */
function countPdfPages(buf) {
  const raw = buf.toString("latin1");
  const leaves = (raw.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
  if (leaves > 0) return leaves;
  const counts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  return counts.length ? Math.max(...counts) : null;
}

/* --------------------------------------------------------------- browser */

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "No Chrome/Chromium found. Install Google Chrome, or set CHROME_PATH to an executable.",
    );
  }
  return found;
}

/* ---------------------------------------------------------------- inline */

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bold, italic and links, applied after escaping so markup can't inject HTML. */
function inline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safe = /^(https?:|mailto:)/i.test(href) ? href : `https://${href}`;
      return `<a href="${safe}">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

/* ------------------------------------------------------------------ html */

function renderBlocks(blocks) {
  return blocks
    .map((b) => {
      if (b.type === "list") {
        return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
      }
      if (b.type === "row") {
        return `<p class="row"><span class="row-label">${inline(b.label)}</span>` +
          `<span class="row-value">${inline(b.value)}</span></p>`;
      }
      return `<p>${inline(b.text)}</p>`;
    })
    .join("\n");
}

function renderDoc(doc) {
  const contact = doc.contact
    .map((c) => {
      const isUrl = /^(https?:\/\/|www\.|[\w.-]+\.(com|io|dev|org|net|me))/i.test(c);
      const isMail = /^[^@\s]+@[^@\s]+\.\w+$/.test(c);
      let inner;
      if (isMail) inner = `<a href="mailto:${escapeHtml(c)}">${escapeHtml(c)}</a>`;
      else if (isUrl) {
        const href = c.startsWith("http") ? c : `https://${c}`;
        inner = `<a href="${escapeHtml(href)}">${escapeHtml(c)}</a>`;
      } else inner = escapeHtml(c);
      // Each item is atomic: a phone number split across two lines looks broken.
      return `<span class="ci">${inner}</span>`;
    })
    .join('<span class="sep">·</span>');

  const sections = doc.sections
    .map((s) => {
      const entries = s.entries
        .map(
          (e) => `
        <article class="entry">
          <div class="entry-head">
            <h3>${inline(e.title)}${e.org ? `<span class="org"> · ${inline(e.org)}</span>` : ""}</h3>
          </div>
          ${e.meta ? `<p class="meta">${inline(e.meta)}</p>` : ""}
          ${renderBlocks(e.blocks)}
        </article>`,
        )
        .join("\n");

      return `
      <section>
        ${s.title ? `<h2>${inline(s.title)}</h2>` : ""}
        ${renderBlocks(s.blocks)}
        ${entries}
      </section>`;
    })
    .join("\n");

  return `
    <header>
      <h1>${inline(doc.name)}</h1>
      <p class="contact">${contact}</p>
    </header>
    ${sections}`;
}

/* ------------------------------------------------------------------ main */

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    console.log(
      "usage: render_pdf.mjs <resume.md|cover-letter.md> [-o out.pdf] [--open] [--html] [--letter|--resume]",
    );
    process.exit(args.help ? 0 : 1);
  }

  const input = path.resolve(args.input);
  const output = path.resolve(args.out ?? input.replace(/\.md$/, ".pdf"));

  const md = await readFile(input, "utf8");
  const doc = parseResume(md);

  if (!doc.name) {
    console.warn("warning: no `# Name` heading found. Is this a resume.md?");
  }

  // Last gate before a PDF reaches a recruiter. Em dashes read as AI-generated,
  // so catch any that slipped past the writing rules rather than trusting them.
  const offenders = md
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(/\r?\n/)
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => line.includes("—"));

  if (offenders.length) {
    console.warn(`warning: ${offenders.length} em dash(es) found. Rewrite, don't substitute:`);
    for (const [n, line] of offenders.slice(0, 5)) {
      console.warn(`  line ${n}: ${line.trim().slice(0, 90)}`);
    }
  }

  const [shell, css] = await Promise.all([
    readFile(path.join(TEMPLATE_DIR, "resume.html"), "utf8"),
    readFile(path.join(TEMPLATE_DIR, "resume.css"), "utf8"),
  ]);

  // Letter mode loosens the density and drops the section rules. Inferred from the
  // filename so `cover-letter.md` just works; --letter / --resume override it.
  const isLetter = args.letter ?? /cover.?letter/i.test(path.basename(input));

  const html = shell
    .replace("/* STYLES */", css) // inlined: no external requests, no file:// races
    .replace("<!-- TITLE -->", escapeHtml(doc.name || (isLetter ? "Cover letter" : "Resume")))
    .replace("<main>", isLetter ? '<main class="letter">' : "<main>")
    .replace("<!-- CONTENT -->", renderDoc(doc));

  if (args.html) {
    const htmlOut = output.replace(/\.pdf$/, ".html");
    await writeFile(htmlOut, html, "utf8");
    console.log(`wrote ${path.relative(process.cwd(), htmlOut)}`);
  }

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");

    await page.pdf({
      path: output,
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
    });

    // Count the pages in the PDF that was just written. Dividing laid-out height by
    // usable page height only gives a lower bound: entries carry break-inside: avoid,
    // so an entry that does not fit is pushed whole to the next page and leaves the
    // remainder of the current one empty. That slack is invisible to the height model,
    // which is how a 3-page resume once reported as "~2 pages".
    const { size } = await stat(output);
    const exact = countPdfPages(await readFile(output));
    const pages =
      exact ??
      (await page.evaluate(() => {
        const dpi = 96;
        const usable = 11 * dpi - 2 * 0.5 * dpi; // Letter height less @page margins
        return Math.max(1, Math.ceil(document.documentElement.scrollHeight / usable));
      }));
    const approx = exact === null ? "~" : "";

    console.log(
      `wrote ${path.relative(process.cwd(), output)} · ${approx}${pages} page${pages > 1 ? "s" : ""} · ${(size / 1024).toFixed(0)}KB`,
    );
    const limit = isLetter ? 1 : 2;
    if (pages > limit) {
      console.warn(
        isLetter
          ? `WARNING: ${approx}${pages} pages, limit is 1. A cover letter must fit on one page. Cut a paragraph.`
          : `WARNING: ${approx}${pages} pages, limit is ${limit}. Cut older roles or bullets before shrinking type.`,
      );
    }
  } finally {
    await browser.close();
  }

  if (args.open) {
    const { spawn } = await import("node:child_process");
    spawn("open", [output], { detached: true, stdio: "ignore" }).unref();
  }
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
