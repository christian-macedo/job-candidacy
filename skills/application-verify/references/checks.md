# What verify.mjs checks, and why

One entry per check. The `check` name is what the script prints in brackets, so a finding
can always be traced back to the rule that produced it and the reasoning behind it.

A check earns its place here by being **decidable**: given the files, it has one answer, the
same answer every run. Anything requiring a reader belongs in the rubric in
[SKILL.md](../SKILL.md) instead. Adding a check that "usually" gets it right is how a
verifier becomes something people learn to ignore.

## Severity

**FAIL** — the document is wrong, or claims something the record does not support. Blocks.

**warn** — worth an answer, but the answer may legitimately be "this is fine". Warnings that
fire on correct documents are bugs in the check, not acceptable noise: five identical
warnings across seven applications means the rule is miscalibrated, not that the documents
are bad.

---

## Structure

| Check | Severity | Catches |
|---|---|---|
| `structure` | FAIL | Missing `# Name` or contact line. The document does not parse as a resume. |
| `em-dash` | FAIL | Em dashes anywhere. Recruiters read them as an AI tell. Rewrite the sentence; do not swap the character. |
| `sections` | warn | A heading outside the set ATS parsers match on. "Where I've Made an Impact" matches nothing. |
| `contact` | FAIL | Any email address other than the publishable one from the profile. The personal address must never reach a recruiter. |

## Evidence

| Check | Severity | Catches |
|---|---|---|
| `evidence-block` | FAIL | Missing block, legacy freeform format, unknown key, or an ID that is not a full atom ID. |
| `atoms-exist` | FAIL | A cited ID with no atom in `master-profile.md`. Usually a typo; occasionally an atom invented at tailor time, which is the failure the citation format exists to catch. |
| `entry-keys` | FAIL | An `entry` key naming a heading the document does not have, or an Experience entry with bullets and no citation line. Every bullet must be attributable. |
| `not-claimed` | FAIL | A term the evidence block disclaims appearing in the document body. The block asserts a negative; this checks it. |

`not-claimed` is the cheapest check here and among the most useful, because it verifies a
claim the writer made about their own work. Negative assertions are rare in generated output
and worth exploiting wherever a format allows them.

## Fidelity against the profile

| Check | Severity | Catches |
|---|---|---|
| `titles` | warn | An Experience entry matching no role heading in the profile. A collapsed `Earlier · <orgs>` entry is exempt, since it deliberately has no counterpart. |
| `dates` | FAIL | A date range that differs from the profile's. Dates are copied, never adjusted, so any difference is a defect. |
| `numbers` | warn | A magnitude in a bullet that appears in no atom the entry cites, and not in the role's own Scope or Context lines. |

`numbers` is a **proxy**: "did the model invent a metric" is not decidable, but "does this
magnitude appear anywhere in the sources this entry cites" is, and it catches essentially
every real instance. The cost is occasional false positives on ordinary numbers, so it warns
rather than fails.

Two exemptions keep it honest. Numbers from the role's `**Scope:**` and `**Context:**` lines
are allowed without a citation, because they describe the job rather than any one
accomplishment. And a short list of numerals that are notation rather than measurement
(`1-to-1`, `p95`, `24/7`, `HTML5`) is stripped before extraction. Both lists are explicit in
the source so that loosening the rule is a visible decision.

## Cross-file

| Check | Severity | Catches |
|---|---|---|
| `pipeline` | FAIL / warn | Missing `analysis.md` or `match.md`. Fails when a resume exists, since the resume is downstream of both; warns otherwise, since a directory may be assessed-only. |
| `index-row` | FAIL | An application directory with no row in `index.md`. A directory without a row is a lost application. |
| `submitted` | FAIL | A status asserting the documents were sent, with no `submitted/` snapshot. Nothing then records which version the recruiter received. |
| `stale-pdf` | warn | Markdown newer than the PDF beside it. The recruiter opens the PDF, not the markdown. |

`submitted` exists because the failure it describes already happened once: an application
reached `applied` with no snapshot and no send date, and by the time anyone noticed, which
version had gone out was no longer recoverable. Most good checks are written this way, one
incident at a time.

## Cover letter

| Check | Severity | Catches |
|---|---|---|
| `letter-length` | warn | Over 450 words. The real constraint is one page; the word count is the early signal. |
| `letter-overlap` | warn | Phrases of eight or more words shared with the resume's bullets. The letter earns its place by supplying what a bullet cannot. |

Overlap is computed against the resume's **prose only**, with the shared contact header
excluded. That exclusion is the difference between a check that gets read and one that fires
on every letter and teaches everyone to skip it.

## Interview rounds

Prep files carry an evidence block for the same reason a resume does: a rehearsed answer is a
claim, said out loud, to someone who can check it. The keys differ because the document does.

```
<!-- evidence
story The two-minute pitch: NWL-M-41, NWL-M-42
scenario Underperformer: NWL-M-26
no-atom: 2. Compensation, 4. Why you left Northwind
boundary: Postgres, hands-on
debrief: 1-screen-debrief.md
note: free prose, ignored by the checker
-->
```

`story` and `scenario` bind to a heading in the file exactly as `entry` binds to a resume
heading, and the citable unit is whichever heading is innermost, `##` or `###`. Binding only to
`###` would let an answer sitting directly under a `##` escape attribution, which is where the
most-rehearsed answer usually lives.

| Check | Severity | Catches |
|---|---|---|
| `prep-when` | FAIL | No `**When:**` line. A prep file with no date on it is the error nobody notices until the morning of the call. |
| `prep-sections` | warn | A round missing a section its reference requires, `## What to collect for the next round` above all. |
| `prep-keys` | FAIL | A `story`/`scenario`/`no-atom` key naming a heading the file does not have, or a citation with no IDs. |
| `prep-quotes` | FAIL | A section containing a blockquote with no citation and no `no-atom` declaration. Anything written to be spoken must be attributable. |
| `prep-numbers` | warn | A magnitude inside a blockquote that appears in no cited atom, no debrief, and nothing that was sent. |
| `boundary` | FAIL | A term declared a boundary for the round that the file never actually states. |
| `prep-debriefs` | FAIL | A debrief for an earlier round that the prep's `debrief:` key does not list, or a listed file that does not exist. |
| `round-order` | FAIL | A prep file for round N+1 when round N has no debrief. |

**`prep-numbers` checks blockquotes only**, and that restriction is the whole reason it is
usable. Bullets in a prep file are notes to self ("two sentences", "about 90 seconds") where a
numeral is meta rather than a claim; checking them would bury the one warning that matters under
a dozen that never do. Blockquotes are the words the user will actually say, which is the only
place an invented number reaches an interviewer. The pool a blockquote may draw on is the file's
own cited atoms plus everything already on the record: the resume, the letter, the analysis, the
match, the submitted notes, and every debrief. A number outside all of that came from nowhere.

**`round-order` is the pipeline rule made mechanical.** Prepping the hiring manager from the
posting throws away everything the screen was run to collect, and the failure is silent: the
file looks finished either way. That is exactly the shape of defect a checker exists for.

**`boundary` is `not-claimed` inverted, and the inversion is the point.** A resume must never
mention the gap; a prep file must, because the round is where the limit gets named before an
interviewer finds it. Reusing `not-claimed` here fired on every honest prep file that did its
job, which is how the rule got flipped rather than kept.

**`no-atom` is a declared exemption, not a hole.** A gate answer about work authorization,
notice period or a compensation band rests on nothing in the profile, and forcing a citation
there would only teach people to cite loosely. Declaring it keeps it checkable: the heading must
exist, it must actually contain a rehearsed answer, and `prep-numbers` still runs against it
with no atoms added to the pool.

## Debriefs

| Check | Severity | Catches |
|---|---|---|
| `debrief-sections` | warn | Missing `## What they asked`, `## What was learned` or `## Feeds forward`. The next round's prep reads these by name. |
| `stated-inferred` | FAIL | A line under `## What was learned` marked neither `**stated**` nor `**inferred**`. |
| `debrief-frozen` | warn | A committed debrief with uncommitted edits. |

**Debriefs deliberately have no evidence block.** They record what an interviewer said, which
the profile cannot corroborate and should not be asked to. Every other document in this repo is
checked against the master profile; a debrief is the one place new information legitimately
enters, and pointing the atom checks at it would only produce failures for facts that are true.

**`stated-inferred` is the check the whole downstream rests on.** A stated team size is a fact
the next round can be built on; an inferred one is a guess, and a week later the two are
indistinguishable unless they were marked at capture time. The failure it prevents is a
candidate repeating their own inference back to an interviewer as something they were told.

`debrief-frozen` warns rather than fails because a legitimate reason exists: fixing a typo. It
is a warning that a record is being rewritten, and the answer is almost always to put the
correction forward, dated, into the next debrief or into `analysis.md` instead. An untracked
debrief never fires it, since a file written minutes ago has nothing to have been revised from.

## Cross-application

`--all` runs every application and reports **atom coverage**: how many atoms have ever been
cited, and which never have. Never-cited atoms are not defects. They point at two different
things worth knowing: profile entries carrying no weight, and real accomplishments that keep
getting passed over.

There is deliberately **no cross-application consistency check**. It would be the obvious
thing to build (the same atom rendering as "72 clusters" in one resume and "70+ clusters" in
another), but it is unnecessary: every resume is checked against the profile, and the profile
is the shared reference. Consistency between applications follows from fidelity to the same
source. A check comparing applications to each other would only fire where `numbers` already
fires, with worse messages.
