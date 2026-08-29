---
name: application-verify
description: Check a tailored application before it is sent — run the deterministic checks, then read the resume and cover letter against the evidence they cite and write applications/<slug>/review.md with a send/fix/rework verdict. Use when the user asks to verify, check, review, audit, proofread or sanity-check an application, a resume or a cover letter, or asks whether something is ready to send.
---

# Application verification

The last read before a recruiter's first one. Two layers, in order: a script decides
everything decidable, then you read for the things a script cannot settle.

Run this in a **fresh turn, not at the end of tailoring**. Checking your own draft in the
context that produced it mostly recovers the reasoning that justified each choice, which is
the opposite of what a review is for. If a resume was just written in this conversation,
that is a reason to be more suspicious of it, not less.

## 1. Run the checks

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" <slug>
```

Every finding is decidable from the files, so **there is nothing here to argue with.** A
`FAIL` is a defect: fix the document, or fix the profile if the profile is what is wrong.
A `warn` is a question worth answering, and `numbers` warnings in particular are a proxy
check that will sometimes flag a true statement, so the answer may legitimately be "the
bullet is right, the citation was incomplete" — in which case fix the citation.

Do not proceed to the reading pass until the script is clean or every remaining finding has
a decision recorded. [references/checks.md](references/checks.md) explains what each check
catches and why it exists.

## 2. Read against the evidence

Read `analysis.md`, `match.md`, `resume.md`, `cover-letter.md` and the cited atoms in
`profile/master-profile.md`. Work the criteria in this order,
and give each one a verdict even when it passes. A rubric applied selectively produces
findings that cannot be compared across runs, which is most of what makes review feel
unreliable.

**Every finding must quote the text it is about and name the rule it breaks.** A finding
that cannot quote anything is not a finding.

### A. Bullet fidelity (the one that matters)

For each bullet, against the atoms its entry cites: does the atom actually support this
claim, at this scope, in this scale? The failure mode is not fabrication, which the script
catches, but **drift**: an atom that says "co-designed with his PM counterpart" becoming
"defined the planning process", or "his team executed" becoming "I built". Rephrasing is
allowed and inflation is not, and the line between them is exactly what you are reading for.

Flag any bullet where the atom would not survive the follow-up question the bullet invites.

### B. Coverage honesty

Re-derive two or three of `match.md`'s coverage ratings from the atoms alone, choosing the
ones rated **direct** on the employer's top must-haves. Those are the ratings a tailoring
pass is most motivated to inflate, and a "direct" that is really "adjacent" is what puts
someone in an interview they cannot hold.

### C. Lead alignment

Do the first two bullets of the most recent role answer the top must-haves in `analysis.md`?
A resume can be entirely true and still argue the wrong case by ordering.

### D. Their vocabulary

Spot-check the analysis vocabulary table against the resume. Each employer term should
appear at least once in a bullet where it is true. Absence is a finding; so is a term used
somewhere it is not quite true, which is worse.

### E. The letter

Does it argue rather than restate? Does it name the objection `match.md` identified, plainly
and without apology? Does any sentence work equally well as a resume bullet, meaning it
should be cut?

### F. Voice

Adjectives doing the work of evidence ("deeply passionate about reliability"), template
phrasing, and any sentence that reads as machine-written. The em dash check is mechanical
and already done; this is the part it cannot do.

### G. The interview rounds, if any exist

Only when `applications/<slug>/interviews/` has files. The script has already checked that every
rehearsed answer cites something, that the numbers spoken are on the record, and that no round
was prepped ahead of the previous round's debrief. What it cannot check:

- **Does the cited atom actually support the spoken answer?** Same drift question as a bullet,
  with more room to drift: a blockquote is four sentences where a bullet is one, and the extra
  words are where "my team executed" quietly becomes "I built".
- **Does the prep contradict what was sent?** Compare the rehearsed claims against
  `submitted/<date>/`, not against the current markdown. A prep file that upgrades a claim the
  resume made is how a candidate contradicts their own paperwork under follow-up.
- **Did the debrief's inferences get promoted to facts?** Read each `**inferred**` line in a
  debrief, then look for it restated as certain in the next round's prep. This is the most
  likely real defect in the whole directory, and it is invisible to the script because both
  files are individually well-formed.
- **Is the boundary sentence honest?** For each term in `boundary`, the script checked only that
  the term appears. Read what it says. "I am not the deepest expert" attached to a claim of
  working knowledge the profile does not support is worse than not naming the gap at all.

## 3. Write review.md

```markdown
# Review — <Role> at <Company>

**Verdict:** send / fix first / rework — one sentence.
**Checks:** N failing, N warning (`verify.mjs`, <date>).

## Must fix
Findings that make a document wrong. Each: the quote, the rule, the fix.

## Worth fixing
Findings that make it weaker but not wrong.

## Checked and clean
The criteria that passed, named. This is what makes the review auditable later: a reader
can tell the difference between a criterion that passed and one that was never applied.

## Script findings
Each FAIL and warn, with the decision taken.
```

**Verdict rules.** Any unresolved script `FAIL`, or any bullet that overstates its atom, is
**rework**. Findings that weaken the argument without making it false are **fix first**.
Only a document with no must-fix findings is **send**.

## What this skill does not do

**It does not fix anything.** Detection and repair are separated on purpose: a reviewer that
edits as it reads stops reviewing and starts defending its own edits. Report, let the user
decide, and hand repairs back to `resume-tailor` or `cover-letter`.

**It does not re-tailor.** "This bullet would be stronger" is out of scope unless the bullet
is wrong, unsupported, or arguing against the analysis. The question is whether the document
is correct and consistent, not whether it is the best possible document.

**It does not touch `applications/index.md`.** A review is not a status change.

**It does not edit a debrief, ever.** A debrief records what an interviewer said. If a review
finds one wrong, that is a finding, and the correction goes forward into the next debrief or
into `analysis.md`, dated. See `debrief-frozen` in [references/checks.md](references/checks.md).
