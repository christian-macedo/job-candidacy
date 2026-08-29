#!/usr/bin/env node
/**
 * Deterministic checks on a tailored application.
 *
 *   node verify.mjs <slug|applications/slug> [--json] [--quiet]
 *   node verify.mjs --all
 *
 * Everything in here is decidable from the files alone: an ID exists or it does
 * not, a number appears in a cited atom or it does not. Anything needing a reader
 * belongs in SKILL.md's rubric, not here. The split is the point — this half has
 * to give the same answer every time, so it never asks a question it cannot settle.
 *
 * Exit code is 1 if any check fails, 0 otherwise (warnings do not fail the run).
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { parseResume } from "../../resume-tailor/scripts/parse_resume.mjs";

// The project being checked, not the directory this script lives in. Installed as a
// plugin, the toolkit sits in a cache directory that holds no profile and no
// applications; the data is always in the project the command was run from.
const ROOT = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const PROFILE = path.join(ROOT, "profile", "master-profile.md");
const APPS = path.join(ROOT, "applications");
const INDEX = path.join(APPS, "index.md");

/** Headings an ATS parser matches on. Anything else renders, but matches nothing. */
const KNOWN_SECTIONS = new Set([
  "summary", "experience", "skills", "education",
  "certifications", "projects", "publications", "recognition", "writing",
]);

/** Statuses that assert a document was actually sent to someone. */
const SENT_STATUSES = new Set([
  "applied", "screen", "hm-round", "final-round", "offer", "rejected",
  "interview", // legacy, pre-dates the three-round vocabulary
]);

/**
 * The three rounds, in order. `n` is the filename prefix, `status` the index
 * vocabulary, `sections` the headings a prep file for that round must carry.
 * Rounds beyond these are allowed (`4-founder.md`) and checked only for the
 * things every prep file needs.
 */
const ROUNDS = [
  { n: 1, slug: "screen", status: "screen",
    sections: ["what to collect", "questions to ask them"] },
  { n: 2, slug: "hiring-manager", status: "hm-round",
    sections: ["what the last round established", "what to collect",
               "questions to ask them"] },
  { n: 3, slug: "loop", status: "final-round",
    sections: ["what the last round established", "questions to ask them"] },
];

/** Sections a debrief must carry, because the next round's prep reads them by name. */
const DEBRIEF_SECTIONS = ["what they asked", "what was learned", "feeds forward"];

/* ------------------------------------------------------------- findings */

const findings = [];
const add = (severity, check, file, line, message, detail) =>
  findings.push({ severity, check, file, line: line ?? null, message, detail: detail ?? null });
const fail = (...a) => add("fail", ...a);
const warn = (...a) => add("warn", ...a);

/* --------------------------------------------------------------- profile */

/**
 * The master profile, reduced to what the checks need: the atom table, the role
 * headings with their date ranges, and the publishable contact details.
 */
function parseProfile(md) {
  const lines = md.split(/\r?\n/);
  const atoms = new Map(); // id -> { id, group, text, numbers }
  const roles = new Map(); // "Title · Org" -> { title, org, meta, dates }
  let group = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const head = line.match(/^###\s+\[([A-Z0-9-]+)\]\s+(.+?)\s+·\s+(.+)$/);
    if (head) {
      group = head[1];
      const meta = (lines[i + 1] ?? "").trim();
      // Everything between the heading and the first atom is role context: the
      // Scope and Context lines. Their numbers describe the job rather than any
      // one accomplishment, so a bullet may use them without citing an atom.
      const context = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (/^#{2,3}\s/.test(lines[j]) || /^\s*-\s*\[[A-Z]/.test(lines[j])) break;
        context.push(lines[j]);
      }
      roles.set(`${head[2]} · ${head[3]}`, {
        title: head[2], org: head[3], meta, dates: extractDates(meta),
        contextNumbers: numbersIn(context.join(" "), false),
      });
      continue;
    }

    const atom = line.match(/^\s*-\s*\[([A-Z0-9-]+-\d+)\]\s*(.+)$/);
    if (atom) {
      atoms.set(atom[1], {
        id: atom[1], group, line: i + 1, text: atom[2], numbers: numbersIn(atom[2], false),
      });
    }
  }

  const emailLine = md.match(/^\s*-\s*\*\*Email:\*\*\s*(.+)$/m)?.[1] ?? "";
  const emails = emailLine.match(/[\w.+-]+@[\w.-]+\.\w+/g) ?? [];

  return { atoms, roles, publishableEmail: emails[0] ?? null, otherEmails: emails.slice(1) };
}

/* --------------------------------------------------------------- numbers */

/**
 * Numeric cores, normalised so that `$1.2M`, `1.2 million` and `~1.2M` compare
 * equal. Deliberately forgiving: the check is "does this magnitude come from
 * somewhere in the record", not "is it formatted identically".
 */
/**
 * Numerals that are notation rather than measurement. Listed explicitly instead of
 * inferred, so that adding one is a visible decision rather than a silent loosening
 * of the provenance rule.
 */
const NON_METRIC = /\b1-to-1s?\b|\b1:1s?\b|\b24\/7\b|\bp\d{2}\b|\bHTML5\b|\bCSS3\b|\bWeb 2\.0\b/gi;

function numbersIn(text, skipYears = true) {
  const out = new Set();
  for (const m of text.replace(NON_METRIC, " ").matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const n = Number(m[0].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    if (skipYears && Number.isInteger(n) && n >= 1900 && n <= 2100) continue; // dates, not claims
    out.add(String(n));
  }
  return out;
}

function extractDates(text) {
  const m = text.match(
    /((?:[A-Z][a-z]{2}\s+)?\d{4})\s*[–—-]\s*(Present|(?:[A-Z][a-z]{2}\s+)?\d{4})/,
  );
  return m ? `${m[1]} – ${m[2]}` : null;
}

/* -------------------------------------------------------------- evidence */

/**
 * The canonical evidence block:
 *
 *   <!-- evidence
 *   summary: NWL-M-10, NWL-M-11
 *   entry Engineering Manager · Northwind Logistics: NWL-M-10, NWL-M-12
 *   skills: NWL-M-03
 *   p2: NWL-E-05                      (cover letters, one key per paragraph)
 *   not-claimed: Java, Go
 *   note: free prose, ignored by the checker
 *   -->
 *
 * One key per line, full IDs only. The old freeform comment allowed `NWL-M-01,07`
 * and `NWL-M-10..14`, which no parser could bind to a specific bullet; this form
 * costs a few more characters and makes every other check in this file possible.
 */
const RESERVED = new Set(["summary", "skills", "education", "projects", "certifications",
  "not-claimed", "note"]);

/**
 * Which keys each kind of document may use. Prep files cite by rehearsed answer
 * rather than by resume entry: `story <heading>` and `scenario <heading>` bind to
 * a `### <heading>` in the file, exactly as `entry` binds to a resume heading, so
 * every spoken line stays attributable to the atoms behind it.
 *
 * Debriefs deliberately have no evidence block. They record what an interviewer
 * said, which the profile cannot corroborate and should not be asked to.
 */
const EVIDENCE_KINDS = {
  resume: { prefixes: ["entry"], flat: RESERVED, paras: true, files: [] },
  prep: {
    prefixes: ["story", "scenario"],
    flat: new Set(["note", "debrief", "no-atom", "boundary"]),
    paras: false,
    files: ["debrief", "no-atom", "boundary"],
  },
};

function parseEvidence(md, file, kind = "resume") {
  const spec = EVIDENCE_KINDS[kind];
  const block = md.match(/<!--\s*evidence\s*\n([\s\S]*?)-->/i);
  if (!block) {
    const legacy = md.match(/<!--\s*Evidence:/i);
    fail("evidence-block", file, null,
      legacy
        ? "Evidence block uses the old freeform format. Migrate to the canonical `<!-- evidence` block."
        : "No `<!-- evidence ... -->` block. Every generated document must cite its atoms.");
    return null;
  }

  const startLine = md.slice(0, block.index).split(/\r?\n/).length;
  const ev = { entries: new Map(), keys: new Map(), notClaimed: [], note: null,
               files: new Map(), all: new Set() };

  block[1].split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const ln = startLine + i + 1;

    // Entry keys bind to a `### Title · Organization` heading. The value is
    // constrained to ID-list characters so the regex binds the last colon,
    // leaving titles free to contain punctuation.
    const prefixed = line.match(/^([a-z][a-z0-9-]*)\s+(.+?):\s*([A-Z0-9,\s-]+)$/);
    if (prefixed && spec.prefixes.includes(prefixed[1])) {
      const ids = splitIds(prefixed[3], file, ln);
      ev.entries.set(prefixed[2].trim(), ids);
      ids.forEach((id) => ev.all.add(id));
      return;
    }

    const kv = line.match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
    if (!kv) {
      fail("evidence-block", file, ln, `Unparseable evidence line: ${line.slice(0, 70)}`);
      return;
    }
    const [, key, value] = kv;

    if (key === "note") { ev.note = value; return; }
    if (key === "not-claimed") {
      ev.notClaimed = value.split(",").map((s) => s.trim()).filter(Boolean);
      return;
    }
    if (spec.files.includes(key)) {
      ev.files.set(key, value.split(",").map((s) => s.trim()).filter(Boolean));
      return;
    }
    if (spec.flat.has(key) || (spec.paras && /^p\d+$/.test(key))) {
      const ids = splitIds(value, file, ln);
      ev.keys.set(key, ids);
      ids.forEach((id) => ev.all.add(id));
      return;
    }
    fail("evidence-block", file, ln, `Unknown evidence key \`${key}\`.`);
  });

  return ev;
}

function splitIds(value, file, line) {
  const ids = [];
  for (const raw of value.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (/^[A-Z][A-Z0-9-]*-\d+$/.test(raw)) ids.push(raw);
    else fail("evidence-block", file, line, `\`${raw}\` is not a full atom ID.`);
  }
  return ids;
}

/* ---------------------------------------------------------------- checks */

function checkStructure(doc, md, file, isLetter) {
  if (!doc.name) fail("structure", file, null, "No `# Name` heading.");
  if (!doc.contact.length) fail("structure", file, null, "No contact line under the name.");

  md.split(/\r?\n/).forEach((line, i) => {
    if (line.includes("—")) {
      fail("em-dash", file, i + 1, "Em dash. Rewrite the sentence, do not swap the character.",
        line.trim().slice(0, 90));
    }
  });

  if (isLetter) return;
  for (const s of doc.sections) {
    if (s.title && !KNOWN_SECTIONS.has(s.title.toLowerCase())) {
      warn("sections", file, null,
        `Section "${s.title}" is not a heading ATS parsers match on.`);
    }
  }
}

function checkContact(doc, md, file, profile) {
  const found = new Set(md.replace(/<!--[\s\S]*?-->/g, "").match(/[\w.+-]+@[\w.-]+\.\w+/g) ?? []);
  for (const email of found) {
    if (email !== profile.publishableEmail) {
      fail("contact", file, null,
        `Document contains \`${email}\`; the publishable address is \`${profile.publishableEmail}\`.`);
    }
  }
}

function checkAtomsExist(ev, file, profile) {
  for (const id of ev.all) {
    if (!profile.atoms.has(id)) {
      fail("atoms-exist", file, null,
        `Cites \`${id}\`, which does not exist in master-profile.md.`);
    }
  }
}

function checkEntries(doc, ev, file, profile) {
  const headings = [];
  for (const s of doc.sections) {
    for (const e of s.entries) headings.push({ section: s.title, ...e });
  }

  for (const key of ev.entries.keys()) {
    if (!headings.some((h) => `${h.title} · ${h.org}` === key)) {
      fail("entry-keys", file, null,
        `Evidence cites entry "${key}", which is not a heading in this document.`);
    }
  }

  for (const h of headings) {
    if (h.section.toLowerCase() !== "experience") continue;
    const key = `${h.title} · ${h.org}`;
    const hasBullets = h.blocks.some((b) => b.type === "list" && b.items.length);
    if (hasBullets && !ev.entries.has(key)) {
      fail("entry-keys", file, null, `Experience entry "${key}" has bullets but no evidence line.`);
    }
  }

  // Title, organization and dates are copied, never rephrased, so a mismatch
  // against the profile is a fidelity bug rather than a stylistic choice.
  for (const h of headings) {
    if (h.section.toLowerCase() !== "experience") continue;
    const key = `${h.title} · ${h.org}`;
    const role = profile.roles.get(key);
    if (!role) {
      // A collapsed "Earlier · <orgs>" entry is a documented tailoring move, not
      // a fidelity problem, so it has no counterpart heading to match.
      if (!/^Earlier\b/.test(h.title)) {
        warn("titles", file, null,
          `Entry "${key}" matches no role heading in the profile. Merged or renamed?`);
      }
      continue;
    }
    const dates = extractDates(h.meta ?? "");
    if (role.dates && dates && dates !== role.dates) {
      fail("dates", file, null,
        `"${key}" shows ${dates}; the profile says ${role.dates}.`);
    }
  }

  return headings;
}

/**
 * Number provenance. A computable proxy for "never invent a metric": every
 * magnitude in a bullet must appear in an atom that entry cites, or in the
 * entry's own date/scope line. Catches invention and inflation; will occasionally
 * flag an ordinary number ("3 teams") that is true but uncited, hence a warning.
 */
function checkNumbers(headings, ev, file, profile) {
  for (const h of headings) {
    const key = `${h.title} · ${h.org}`;
    const ids = ev.entries.get(key) ?? [];
    const allowed = new Set(numbersIn(h.meta ?? "", false));
    for (const n of profile.roles.get(key)?.contextNumbers ?? []) allowed.add(n);
    for (const id of ids) {
      for (const n of profile.atoms.get(id)?.numbers ?? []) allowed.add(n);
    }

    for (const b of h.blocks) {
      if (b.type !== "list") continue;
      for (const item of b.items) {
        for (const n of numbersIn(item)) {
          if (!allowed.has(n)) {
            warn("numbers", file, null,
              `\`${n}\` in "${h.title}" appears in no atom this entry cites.`,
              item.slice(0, 90));
          }
        }
      }
    }
  }
}

/** Negative assertions are checkable: if the writer disclaimed it, it must be absent. */
function checkNotClaimed(md, ev, file) {
  const body = md.replace(/<!--[\s\S]*?-->/g, "");
  for (const term of ev.notClaimed) {
    if (term.length < 2) continue;
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(body)) {
      fail("not-claimed", file, null,
        `Evidence disclaims "${term}", but it appears in the document body.`);
    }
  }
}

/** Every paragraph of prose in a parsed document, header and contact line excluded. */
function prose(doc) {
  const out = [];
  const walk = (blocks) => {
    for (const b of blocks) {
      if (b.type === "para") out.push(b.text);
      else if (b.type === "list") out.push(...b.items);
    }
  };
  for (const s of doc.sections) {
    walk(s.blocks);
    for (const e of s.entries) walk(e.blocks);
  }
  return out;
}

function checkLetter(doc, resumeDoc, file) {
  const body = prose(doc).join(" ");
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words > 450) {
    warn("letter-length", file, null, `${words} words. The ceiling is 450, and it must fit one page.`);
  }

  if (!resumeDoc) return;

  // Compared against the resume's bullets alone. The shared contact header would
  // otherwise register as overlap on every letter, which is noise, and noise is
  // how a checker teaches people to ignore it.
  const grams = (t) => {
    const w = t.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
    const g = new Set();
    for (let i = 0; i + 8 <= w.length; i++) g.add(w.slice(i, i + 8).join(" "));
    return g;
  };
  const resumeGrams = grams(prose(resumeDoc).join(" "));
  const shared = [...grams(body)].filter((g) => resumeGrams.has(g));
  if (shared.length) {
    warn("letter-overlap", file, null,
      `${shared.length} phrase(s) of 8+ words shared with the resume. The letter must argue, not restate.`,
      shared[0]);
  }
}

async function checkCrossFile(slug, dir, indexMd) {
  // The upstream files are mandatory once a resume exists, because the resume is
  // built from them. Without one, a directory may legitimately be assessed-only.
  const hasResume = existsSync(path.join(dir, "resume.md"));
  for (const f of ["analysis.md", "match.md"]) {
    if (!existsSync(path.join(dir, f))) {
      const say = hasResume ? fail : warn;
      say("pipeline", `${slug}/${f}`, null,
        hasResume
          ? `Missing ${f}, but resume.md exists. The resume is downstream of it.`
          : `Missing ${f}. Assessed-only application, or a skipped pipeline step?`);
    }
  }

  const row = indexMd.split(/\r?\n/).find((l) => l.includes(`(${slug}/)`));
  if (!row) {
    fail("index-row", "applications/index.md", null,
      `No row for \`${slug}\`. A directory without a row is a lost application.`);
    return;
  }

  const cells = row.split("|").map((c) => c.trim());
  const status = (cells[6] ?? "").replace(/\*/g, "").toLowerCase();
  if (SENT_STATUSES.has(status)) {
    const submitted = path.join(dir, "submitted");
    let snapshots = [];
    if (existsSync(submitted)) snapshots = await readdir(submitted);
    if (!snapshots.length) {
      fail("submitted", "applications/index.md", null,
        `Status is \`${status}\` but no submitted/ snapshot exists. ` +
        `Nothing records which version the recruiter received.`);
    }
  }
}

/* ------------------------------------------------------- interview rounds */

/**
 * Prep and debrief files are ordinary prose, not resume grammar, so they get a
 * light structural read: `##`/`###` headings, and the blockquote lines under each
 * `###`. Blockquotes are the unit that matters — in a prep file they are the words
 * the user will actually say out loud, which is where an unsupported number does
 * real damage.
 */
function parseRoundDoc(md) {
  const body = md.replace(/<!--[\s\S]*?-->/g, "");
  const lines = body.split(/\r?\n/);
  const h2 = [];               // lowercased `##` headings, for the section checks
  const sections = new Map();  // heading text -> { quotes: [], line }
  let current = null;

  // The citable unit is whichever heading is innermost, `##` or `###`. Binding
  // only to `###` would let a quoted answer sitting directly under a `##` escape
  // attribution, which is precisely where the most-rehearsed answer usually lives.
  lines.forEach((raw, i) => {
    const line = raw.trim();
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      const text = m[2].trim();
      if (m[1] === "##") h2.push(text.toLowerCase());
      current = text;
      if (!sections.has(text)) sections.set(text, { quotes: [], line: i + 1 });
      return;
    }
    if (line.startsWith(">") && current) {
      sections.get(current).quotes.push(line.replace(/^>\s?/, ""));
    }
  });

  return { h2, sections, header: body.split(/\n##\s/)[0] };
}

/** Every number anywhere in a file, used to build the pool a prep file may draw on. */
async function numbersOfFile(p) {
  if (!existsSync(p)) return [];
  return [...numbersIn(await readFile(p, "utf8"))];
}

/**
 * Round files are named `<n>-<name>.md`, with the debrief as `<n>-<name>-debrief.md`.
 */
function readRoundDir(names) {
  const preps = [], debriefs = new Map();
  for (const f of names.filter((n) => n.endsWith(".md")).sort()) {
    const m = f.match(/^(\d+)-(.+?)(-debrief)?\.md$/);
    if (!m) continue;
    if (m[3]) debriefs.set(Number(m[1]), f);
    else preps.push({ n: Number(m[1]), name: m[2], file: f });
  }
  return { preps, debriefs };
}

/**
 * The pipeline rule, made mechanical: a prep file for round N+1 may not exist
 * until round N has a debrief. Prepping the hiring manager from the posting throws
 * away everything the screen was run to collect, and the failure is silent — the
 * file looks finished either way, which is exactly why it needs a check.
 */
function checkRoundOrder(slug, preps, debriefs) {
  for (const p of preps) {
    for (const earlier of preps.filter((x) => x.n < p.n)) {
      if (!debriefs.has(earlier.n)) {
        fail("round-order", `${slug}/interviews/${p.file}`, null,
          `Round ${p.n} is prepped but round ${earlier.n} has no debrief. ` +
          `Run /debrief before prepping the next round.`);
      }
    }
  }
}

async function checkPrep(slug, dir, prep, debriefFiles, profile, pool) {
  const file = `${slug}/interviews/${prep.file}`;
  const md = await readFile(path.join(dir, prep.file), "utf8");
  const doc = parseRoundDoc(md);
  const spec = ROUNDS.find((r) => r.n === prep.n);

  // A prep file with no time on it is worse than none, and it is the one error
  // nobody notices until the morning of the call.
  if (!/^\*\*When:?\*\*|^\*\*When[:\s]/m.test(doc.header)) {
    fail("prep-when", file, null,
      "No `**When:**` line in the header. A prep file must carry the date, time and duration.");
  }

  for (const want of spec?.sections ?? ["questions to ask them"]) {
    if (!doc.h2.some((h) => h.includes(want))) {
      warn("prep-sections", file, null, `No \`## ${want}\` section.`);
    }
  }

  const ev = parseEvidence(md, file, "prep");
  if (!ev) return;
  checkAtomsExist(ev, file, profile);

  // The inverse of a resume's `not-claimed`, and the right shape for this document.
  // A resume must never mention the gap; a prep file must, because the round is
  // where the limit gets named before an interviewer finds it. So the assertion
  // flips: every term listed as a boundary has to actually appear.
  const body = md.replace(/<!--[\s\S]*?-->/g, "");
  for (const term of ev.files.get("boundary") ?? []) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (!re.test(body)) {
      fail("boundary", file, null,
        `Evidence declares "${term}" a boundary for this round, but the file never states it. ` +
        `A gap the interviewer will find needs its honest sentence written before the call.`);
    }
  }

  // Every rehearsed line is attributable, and every citation binds to a real
  // heading. Same contract as a resume entry, applied to the thing being said.
  for (const [heading, ids] of ev.entries) {
    if (!doc.sections.has(heading)) {
      fail("prep-keys", file, null,
        `Evidence cites "${heading}", which is not a heading in this file.`);
    }
    if (!ids.length) {
      fail("prep-keys", file, null, `"${heading}" is cited with no atom IDs.`);
    }
  }
  // `no-atom` is the deliberate exemption: a gate answer about work authorization,
  // notice period or compensation is a rehearsed line that rests on nothing in the
  // profile, and forcing a citation there would only teach people to cite loosely.
  // Declaring it is a negative assertion, so it is still checkable — the heading
  // must exist, and the number check below runs against it with no atoms added.
  const noAtom = new Set(ev.files.get("no-atom") ?? []);
  for (const heading of noAtom) {
    if (!doc.sections.has(heading)) {
      fail("prep-keys", file, null,
        `\`no-atom\` names "${heading}", which is not a heading in this file.`);
    } else if (!doc.sections.get(heading).quotes.length) {
      warn("prep-keys", file, null,
        `\`no-atom: ${heading}\` exempts a section that has no rehearsed answer in it.`);
    }
  }
  for (const [heading, sec] of doc.sections) {
    if (sec.quotes.length && !ev.entries.has(heading) && !noAtom.has(heading)) {
      fail("prep-quotes", file, sec.line,
        `"${heading}" contains a rehearsed answer but no \`story\`/\`scenario\` citation. ` +
        `Anything written to be spoken traces to an atom, or is declared in \`no-atom\`.`);
    }
  }

  // Prep must have read every debrief that exists. Listing them is cheap; the
  // failure it catches — a round prepped from the posting while a debrief sat
  // unread beside it — is the whole reason the loop is sequenced.
  const listed = new Set(ev.files.get("debrief") ?? []);
  for (const d of debriefFiles) {
    if (!listed.has(d)) {
      fail("prep-debriefs", file, null,
        `\`${d}\` exists but is not listed in the evidence block's \`debrief:\` key. ` +
        `Prep reads every debrief before it is written.`);
    }
  }
  for (const d of listed) {
    if (!debriefFiles.includes(d)) {
      fail("prep-debriefs", file, null, `\`debrief: ${d}\` names a file that does not exist.`);
    }
  }

  // Blockquotes only. Bullets in a prep file are notes to self ("two sentences",
  // "about 90 seconds") where a numeral is meta rather than a claim; checking them
  // would bury the one warning that matters under a dozen that never do.
  const allowed = new Set(pool);
  for (const id of ev.all) for (const n of profile.atoms.get(id)?.numbers ?? []) allowed.add(n);
  for (const [heading, sec] of doc.sections) {
    for (const q of sec.quotes) {
      for (const n of numbersIn(q)) {
        if (!allowed.has(n)) {
          warn("prep-numbers", file, null,
            `\`${n}\` is spoken in "${heading}" but appears in no cited atom, ` +
            `no debrief, and nothing that was sent.`,
            q.slice(0, 90));
        }
      }
    }
  }
}

async function checkDebrief(slug, dir, fileName) {
  const file = `${slug}/interviews/${fileName}`;
  const full = path.join(dir, fileName);
  const md = await readFile(full, "utf8");
  const doc = parseRoundDoc(md);

  for (const want of DEBRIEF_SECTIONS) {
    if (!doc.h2.some((h) => h.includes(want))) {
      warn("debrief-sections", file, null, `No \`## ${want}\` section.`);
    }
  }

  // The one distinction the whole downstream depends on. A stated team size is a
  // fact the next round can be built on; an inferred one is a guess, and the two
  // are indistinguishable a week later unless they were marked at capture time.
  const lines = md.split(/\r?\n/);
  let inLearned = false;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (/^##\s/.test(line)) { inLearned = /what was learned/i.test(line); return; }
    if (!inLearned || !line.startsWith("-")) return;
    if (!/\*\*(stated|inferred)\*\*/i.test(line)) {
      fail("stated-inferred", file, i + 1,
        "Learned fact is marked neither **stated** nor **inferred**.", line.slice(0, 90));
    }
  });

  // A debrief is a record. Editing one after the fact to match what turned out to
  // be true destroys the only thing in this directory that is not a guess.
  const rel = path.relative(ROOT, full);
  const git = (args) => {
    try {
      execFileSync("git", ["-C", ROOT, ...args], { stdio: "ignore" });
      return true;
    } catch (err) {
      if (err.status === 1) return false;
      return null; // no git, or not a repository: the check simply does not apply
    }
  };
  // An untracked debrief is one that has never been committed, which is the normal
  // state of a file written minutes ago. Only a committed one can have been revised.
  if (git(["ls-files", "--error-unmatch", rel]) === true &&
      git(["diff", "--quiet", "HEAD", "--", rel]) === false) {
    warn("debrief-frozen", file, null,
      "Committed debrief has uncommitted edits. Corrections go forward, dated, " +
      "into the next debrief or into analysis.md.");
  }
}

async function checkInterviews(slug, dir, profile, indexMd) {
  const interviews = path.join(dir, "interviews");
  if (!existsSync(interviews)) return;

  const { preps, debriefs } = readRoundDir(await readdir(interviews));
  if (!preps.length && !debriefs.size) return;

  checkRoundOrder(slug, preps, debriefs);

  // The pool a prep file may draw numbers from: what was sent, what an interviewer
  // said, and the analysis. Atoms are added per file from its own citations.
  const pool = new Set();
  const sent = path.join(dir, "submitted");
  const sentDirs = existsSync(sent) ? await readdir(sent) : [];
  const sources = [
    path.join(dir, "resume.md"), path.join(dir, "cover-letter.md"),
    path.join(dir, "analysis.md"), path.join(dir, "match.md"),
    ...sentDirs.map((d) => path.join(sent, d, "NOTES.md")),
    ...[...debriefs.values()].map((f) => path.join(interviews, f)),
  ];
  for (const src of sources) for (const n of await numbersOfFile(src)) pool.add(n);

  const debriefFiles = [...debriefs.values()].sort();
  for (const prep of preps) {
    // A prep file only owes provenance for debriefs that existed when it was
    // written, which is every debrief for a round before its own.
    const priors = [...debriefs.entries()].filter(([n]) => n < prep.n).map(([, f]) => f).sort();
    await checkPrep(slug, interviews, prep, priors, profile, pool);
  }
  for (const f of debriefFiles) await checkDebrief(slug, interviews, f);

  // The index is the answer to "where does each one stand", so a process that has
  // moved two rounds on while the row still says `screen` defeats the file.
  const row = indexMd.split(/\r?\n/).find((l) => l.includes(`(${slug}/)`));
  if (row && preps.length) {
    const status = (row.split("|").map((c) => c.trim())[6] ?? "").replace(/\*/g, "").toLowerCase();
    const furthest = ROUNDS.find((r) => r.n === Math.max(...preps.map((p) => p.n)));
    const terminal = ["offer", "rejected", "withdrawn", "stale"].some((t) => status.includes(t));
    if (furthest && !terminal && !status.includes(furthest.status)) {
      warn("index-round", "applications/index.md", null,
        `Round ${furthest.n} is prepped but the index status is \`${status || "empty"}\`, ` +
        `not \`${furthest.status}\`.`);
    }
  }
}

/* ------------------------------------------------------------------ run */

async function verifySlug(slug, profile, indexMd) {
  const dir = path.join(APPS, slug);
  if (!existsSync(dir)) throw new Error(`No such application: ${slug}`);
  const cited = new Set();

  await checkCrossFile(slug, dir, indexMd);
  await checkInterviews(slug, dir, profile, indexMd);

  const resumePath = path.join(dir, "resume.md");
  let resumeDoc = null;

  if (existsSync(resumePath)) {
    const resumeMd = await readFile(resumePath, "utf8");
    const file = `${slug}/resume.md`;
    const doc = parseResume(resumeMd);
    resumeDoc = doc;
    checkStructure(doc, resumeMd, file, false);
    checkContact(doc, resumeMd, file, profile);
    const ev = parseEvidence(resumeMd, file);
    if (ev) {
      ev.all.forEach((id) => cited.add(id));
      checkAtomsExist(ev, file, profile);
      const headings = checkEntries(doc, ev, file, profile);
        checkNumbers(headings, ev, file, profile);
      checkNotClaimed(resumeMd, ev, file);
    }
  }

  const letterPath = path.join(dir, "cover-letter.md");
  if (existsSync(letterPath)) {
    const md = await readFile(letterPath, "utf8");
    const file = `${slug}/cover-letter.md`;
    const doc = parseResume(md);
    checkStructure(doc, md, file, true);
    checkContact(doc, md, file, profile);
    const ev = parseEvidence(md, file);
    if (ev) {
      ev.all.forEach((id) => cited.add(id));
      checkAtomsExist(ev, file, profile);
      checkNotClaimed(md, ev, file);
    }
    checkLetter(doc, resumeDoc, file);
  }

  // A stale PDF is a real hazard: the file a recruiter opens is the PDF, not the
  // markdown it was rendered from.
  for (const base of ["resume", "cover-letter"]) {
    const md = path.join(dir, `${base}.md`);
    const pdf = path.join(dir, `${base}.pdf`);
    if (existsSync(md) && existsSync(pdf)) {
      const [a, b] = await Promise.all([stat(md), stat(pdf)]);
      if (a.mtimeMs > b.mtimeMs) {
        warn("stale-pdf", `${slug}/${base}.pdf`, null,
          "Markdown is newer than the PDF. Re-render before sending.");
      }
    }
  }

  return cited;
}

function report(json, quiet) {
  const fails = findings.filter((f) => f.severity === "fail");
  const warns = findings.filter((f) => f.severity === "warn");

  if (json) {
    console.log(JSON.stringify({ ok: !fails.length, fails: fails.length, warns: warns.length, findings }, null, 2));
    return fails.length ? 1 : 0;
  }

  if (!quiet || fails.length) {
    for (const f of findings) {
      const tag = f.severity === "fail" ? "FAIL" : "warn";
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      console.log(`${tag}  [${f.check}] ${loc}`);
      console.log(`      ${f.message}`);
      if (f.detail) console.log(`      > ${f.detail}`);
    }
  }

  console.log(
    findings.length
      ? `\n${fails.length} failing, ${warns.length} warning.`
      : "\nAll checks passed.",
  );
  return fails.length ? 1 : 0;
}

async function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const quiet = argv.includes("--quiet");
  const all = argv.includes("--all");
  const target = argv.find((a) => !a.startsWith("--"));

  if (!all && !target) {
    console.log("usage: verify.mjs <slug> [--json] [--quiet]  |  verify.mjs --all");
    process.exit(1);
  }

  // Resolving ROOT from the caller makes "wrong directory" a reachable state, so
  // say which directory was tried rather than failing on a bare ENOENT.
  if (!existsSync(PROFILE) || !existsSync(APPS)) {
    console.error(
      `error: no job-candidacy project at ${ROOT}\n` +
      "  expected profile/master-profile.md and applications/ below it\n" +
      "  run this from your project root, or set CLAUDE_PROJECT_DIR to it",
    );
    process.exit(2);
  }

  const [profileMd, indexMd] = await Promise.all([
    readFile(PROFILE, "utf8"),
    readFile(INDEX, "utf8"),
  ]);
  const profile = parseProfile(profileMd);

  const slugs = all
    ? (await readdir(APPS, { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [path.basename(target.replace(/\/$/, ""))];

  const cited = new Set();
  for (const slug of slugs) {
    for (const id of await verifySlug(slug, profile, indexMd)) cited.add(id);
  }

  const exit = report(json, quiet);

  // Atoms nobody has ever used are not a defect, but they are the cheapest
  // signal available about where the profile is carrying dead weight or where
  // a real accomplishment keeps getting overlooked.
  if (all && !json) {
    const unused = [...profile.atoms.keys()].filter((id) => !cited.has(id));
    console.log(`\nAtom coverage: ${cited.size} of ${profile.atoms.size} cited across ${slugs.length} applications.`);
    if (unused.length) console.log(`Never cited: ${unused.join(", ")}`);
  }

  process.exit(exit);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(2);
});
