---
name: cover-letter
description: Write applications/<slug>/cover-letter.md — a one-page letter tailored to a specific job, arguing the case the resume can only list, and render it to a PDF matching the resume's design. Use when the user asks for a cover letter, a letter of interest, an application note, or a "why this company" message for a role that already has a resume.
---

# Cover letter

A resume lists evidence. A letter argues from it. Write the argument the resume cannot make:
why *this* person for *this* team, what the parallel is, and how the obvious objection is
answered.

Read all four before writing — `profile/master-profile.md`,
`applications/<slug>/analysis.md`, `match.md`, and `resume.md`. The letter must not contradict
the resume, introduce evidence that isn't in the profile, or repeat the resume's bullets in
sentence form. If `resume.md` doesn't exist yet, run `resume-tailor` first — the letter is
downstream of it.

## What the letter is for

`match.md` already contains the argument. It names the strengths to lead with, the honest
gaps, and usually a **Cover-letter material** section written while the evidence was fresh.
Start there; the letter is largely a matter of putting that reasoning into prose.

Three jobs, in order of value:

1. **Draw the parallel the recruiter would otherwise have to construct.** The strongest letters
   say "the thing you are hiring for is the thing I have already done", concretely, in the
   employer's own words from the analysis vocabulary table.
2. **Answer the obvious objection before it is raised.** Location, a level change, a missing
   technology, a career gap. `match.md`'s gap table lists them. Naming one plainly reads as
   confidence; leaving it for them to find reads as a hole.
3. **Show you understand their problem**, not just their posting. The inferred-priorities
   section of `analysis.md` is where this comes from.

## Structure

Four or five paragraphs, one page, never more:

1. **The role and the parallel.** Name the job, then in two sentences the closest thing the
   user has actually done. No throat-clearing — "I am writing to apply for" wastes the one
   line most likely to be read.
2. **The strongest evidence**, one story rather than a list. Pick the single accomplishment
   that best answers their top must-have and give it the shape a bullet cannot: what the
   situation was, what was done, what changed. Numbers from the atoms, unchanged.
3. **Their specific problem.** What the posting implies about the next year, and the relevant
   experience. This is the paragraph that proves the letter was not sent to fifty companies.
4. **The objection.** One short paragraph, stated plainly, no apology, no over-explaining.
5. **Close.** One or two lines. What is being asked for, and nothing else.

## Rules

- **Around 400 words, 450 at the outside, and it must fit one page.** The page is the real
  constraint; the word count is a guard against rambling. If a letter runs long, cut filler
  before cutting a concrete detail, and never shrink the type to buy room.
- **First person, plain voice.** The resume drops pronouns; a letter does not. It should sound
  like the person, not like a template — draw on their own writing (the LinkedIn essays in the
  profile show how they actually write) rather than a house style.
- **Every fact traces to an atom.** Same hard rule as the resume — see
  [conventions.md](${CLAUDE_PLUGIN_ROOT}/reference/conventions.md). The letter's freedom is in framing, never in content.
- **No em dashes.** Recruiters read them as an AI tell, and a letter is the document most
  likely to be judged on whether a human wrote it. Rewrite around them; the patterns are in
  [ats-rules.md](../resume-tailor/references/ats-rules.md). This costs a letter more than it
  costs a resume, because the em dash is exactly the punctuation good prose reaches for. Use
  commas, colons, full stops, and shorter sentences.
- **No adjectives doing the work of evidence.** Not "deeply passionate about reliability".
  Give the incident numbers and let the reader conclude it.
- **Never restate the resume.** If a sentence would work equally well as a resume bullet, cut
  it. The letter earns its place by supplying what a bullet cannot: causality, judgment, and
  the reason this person wants this job.
- **Address it to a person if one is known**, otherwise the team. Never "To Whom It May
  Concern".

## Format

The renderer parses the same grammar as the resume, so the header matches and the two read as
a set:

```markdown
# Robin Alvarez
Engineering Manager · Open to relocation · robin@example.com · +1 555-0142 · robinalvarez.example

17 August 2026

Hiring Team, Platform Reliability
Helios Data, Lisbon

Dear Platform Reliability team,

First paragraph.

Second paragraph.

Sincerely,
**Robin Alvarez**

<!-- evidence
p2: NWL-M-07
p3: NWL-E-05, NWL-M-12
not-claimed: Kubernetes, Go
note: ¶4 is work authorization. Objection taken on: sponsorship. Left for interview: level.
-->
```

Everything between the contact line and the sign-off is plain paragraphs — no `##` headings.

The evidence block follows the same strict grammar as the resume: one key per line, full atom
IDs only, comma-separated. Letters key by paragraph (`p1`, `p2`, …) rather than by entry, one
line per paragraph that rests on an atom. A paragraph carrying no atom (the close, a
work-authorization line) gets no key; say so in `note` instead. `not-claimed` is enforced, so
nothing listed there may appear in the letter.

Then verify, which also checks the letter against the resume for restated phrasing:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" applications/<slug>
```

## Render

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/resume-tailor/scripts/render_pdf.mjs" applications/<slug>/cover-letter.md
```

Letter mode is inferred from the filename (`--letter` forces it). The renderer warns if the
result runs past one page, which for a letter means cut a paragraph — not shrink the type.

Send the PDF with `SendUserFile` alongside a note on which objection the letter takes on and
which it deliberately leaves for the interview.
