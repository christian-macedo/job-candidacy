// Regression tests for verify.mjs. Run with: node --test skills/application-verify/scripts/
//
// Each test copies example/ into a temporary directory, adds the files the case
// needs, and runs the real script against it, so the worked example stays as it is.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERIFY = path.join(HERE, "verify.mjs");
const EXAMPLE = path.resolve(HERE, "../../../example");
const SLUG = "helios-data-engineering-manager-platform";

async function withProject(files, fn) {
  const root = await mkdtemp(path.join(tmpdir(), "verify-test-"));
  try {
    await cp(EXAMPLE, root, { recursive: true });
    const interviews = path.join(root, "applications", SLUG, "interviews");
    for (const [name, body] of Object.entries(files)) {
      await writeFile(path.join(interviews, name), body);
    }
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function run(root) {
  let out;
  try {
    out = execFileSync("node", [VERIFY, SLUG, "--json"], {
      cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: "utf8",
    });
  } catch (err) {
    out = err.stdout; // exit 1 on any FAIL; the JSON is still on stdout
  }
  return JSON.parse(out).findings;
}

const prep = (debriefs) => `# Round 2: Hiring manager · Helios Data

**When:** Thursday 3 September 2026, 10:00 WEST, 60 minutes, video.

## What the last round established

Notes.

## What to collect

1. Notes.

## Questions to ask them

1. Notes.

<!-- evidence
debrief: ${debriefs.join(", ")}
-->
`;

// Two sessions in one round, each with its own debrief, sharing the round number.
async function secondRoundOneDebrief() {
  const first = await readFile(
    path.join(EXAMPLE, "applications", SLUG, "interviews", "1-screen-debrief.md"), "utf8");
  return first.replace("# Debrief, round 1: Recruiter screen", "# Debrief, round 1: Follow-up call");
}

test("same-numbered debriefs are all kept: listing both passes", async () => {
  await withProject({
    "1-screen-followup-debrief.md": await secondRoundOneDebrief(),
    "2-hiring-manager.md": prep(["1-screen-debrief.md", "1-screen-followup-debrief.md"]),
  }, async (root) => {
    const found = run(root).filter((f) => f.check === "prep-debriefs");
    assert.deepEqual(found, []);
  });
});

test("same-numbered debriefs are all kept: leaving one out fails", async () => {
  await withProject({
    "1-screen-followup-debrief.md": await secondRoundOneDebrief(),
    "2-hiring-manager.md": prep(["1-screen-debrief.md"]),
  }, async (root) => {
    const found = run(root).filter((f) => f.check === "prep-debriefs");
    assert.equal(found.length, 1);
    assert.match(found[0].message, /1-screen-followup-debrief\.md` exists but is not listed/);
  });
});

test("same-numbered prep files are each checked", async () => {
  await withProject({
    "2-hiring-manager.md": prep(["1-screen-debrief.md"]),
    "2-product-program.md": prep([]),
  }, async (root) => {
    const found = run(root).filter((f) => f.check === "prep-debriefs");
    assert.equal(found.length, 1);
    assert.match(found[0].file, /2-product-program\.md$/);
  });
});
