---
name: job-analyze
description: Decode a job posting into applications/<slug>/analysis.md — must-have versus nice-to-have requirements, the employer's exact vocabulary, inferred team priorities, and the seniority signal. Use when the user shares a job description, a job URL, or asks to analyze, evaluate, or break down a role before tailoring a resume.
---

# Job analysis

Convert one posting into a structured brief that `resume-tailor` can act on. The output is
about **the employer**, not about the user — matching comes later, and mixing the two here
produces a brief that flatters instead of informs.

## 1. Get the posting text

- **URL** → use the `defuddle` skill to pull clean markdown. If the site blocks it
  (LinkedIn and Workday routinely do), say so and ask the user to paste the text.
- **Pasted text** → use it as-is.

Save the raw text to `applications/<slug>/posting.md` with the source URL and today's date
at the top. Postings get taken down; the local copy is the record.

`<slug>` is `company-role` in kebab-case: `stripe-engineering-manager-payments`. Ask the
user only if the company or role is genuinely ambiguous.

## 2. Read past the boilerplate

Most postings are 60% legal and cultural filler. The signal is in:

- **Repetition.** A requirement stated in the summary, the responsibilities, *and* the
  qualifications is the actual job. Something mentioned once at the bottom is a wish.
- **Ordering.** First bullet in the responsibilities list is usually what the hire is
  really for.
- **Verbs.** "Own", "define", "set direction" signal scope; "support", "contribute to",
  "assist with" signal a narrower role than the title suggests.
- **What's conspicuously missing.** An infra manager posting with no reliability or
  on-call language is either a greenfield build or a team that hasn't been burned yet.
- **Team tells.** Reporting line, whether the team is named, whether the posting mentions
  a rewrite/migration/"first hire" — these say more about the year ahead than the
  qualifications list does.

## 3. Write analysis.md

```markdown
# <Role> — <Company>

**Source:** <url or "pasted"> · **Analyzed:** <date> · **Posted:** <date if known>
**Location / model:** … · **Level signal:** … · **Comp (if stated):** …

## What this job actually is
Two or three sentences, in plain language, on the problem they are hiring someone to solve.

## Must-haves
Requirements that are screening criteria — stated as required, repeated, or structural.
| # | Requirement | Their words | Evidence it's a must |
|---|---|---|---|

## Nice-to-haves
Same table, for preferences. Be honest about which column a requirement belongs in;
inflating nice-to-haves into must-haves distorts the resume that follows.

## Their vocabulary
The exact terms to mirror, with the equivalent term the user's own history uses.
| Their term | User's term for the same thing |
|---|---|
| "observability" | "monitoring and telemetry" |

This table is the highest-value part of the file. ATS keyword matching and a human skim
both key off the employer's wording, and the user's profile will not use it by default.

## Inferred priorities
What the posting implies about the team's next 12 months, and the reasoning behind each
inference. Mark these clearly as inference — they inform emphasis, not claims.

## Likely screening questions
Three to five, based on the must-haves.

## Where this will be hard
The requirements that look like a stretch given the posting alone. A first pass at gaps;
`resume-tailor` does the rigorous version against the actual profile.
```

## 4. Register the application

Add a row to `applications/index.md` with status `drafted`,
the location and work model, and today's date. This is the only place that answers "what have
I applied to and where does each one stand", so a directory that exists without a row is a
lost application.

## 5. Hand off

Report the three or four must-haves that will drive the resume, plus anything that looks
like a hard blocker (clearance, on-site in another city, a licence the user has never
mentioned). Then offer to run `resume-tailor`.

Do not check the profile for matches here, and do not start rewriting bullets. Keeping
analysis independent of the user's history is what stops the brief from being bent toward
a favourable reading.
