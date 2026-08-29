---
name: resume-tailor
description: Score how well the user's profile matches a role, then write applications/<slug>/resume.md and render it to PDF — selecting, re-ordering, and rewriting evidence from profile/master-profile.md against the job's analysis.md. Use when the user asks to tailor, customize, draft, or generate a resume for a particular job, or asks how well they match a role.
---

# Resume tailoring

Produce two files: an honest `match.md`, then a `resume.md` that argues the strongest true
case for this specific role — and render it.

Read `profile/master-profile.md` and
`applications/<slug>/analysis.md` before writing anything. If either is missing, run
`profile-import` or `job-analyze` first.

## 1. Match before writing

Fill the match table before drafting a single bullet. Doing it in this order is what keeps
the resume grounded — the evidence decides the story, not the reverse.

For each must-have and nice-to-have from `analysis.md`, find the evidence atoms that speak
to it and rate the coverage:

- **Direct** — an atom demonstrates exactly this, at comparable scale.
- **Adjacent** — an atom demonstrates the underlying capability in a different context
  (different cloud, different domain, smaller scale). Say what the distance is.
- **Thin** — some exposure, nothing that would survive a follow-up question.
- **None** — no evidence. Write "none". Do not reach.

```markdown
# Match — <Role> at <Company>

**Verdict:** <strong / worth applying / stretch / poor fit> — one sentence of why.
**Must-have coverage:** 6 of 8 direct, 1 adjacent, 1 none.

## Coverage
| Requirement | Coverage | Evidence | Note |
|---|---|---|---|
| Kubernetes at scale | direct | NWL-01, NWL-05 | 72 clusters, above their stated scale |
| Go in production | none | — | Profile shows C#/.NET only |

## Strengths to lead with
The two or three things that make this candidacy distinctive for *this* posting.

## Gaps
Honest, specific, and paired with the nearest true adjacent evidence. For each: is it
disqualifying, coachable, or addressable in a cover letter?

## Recommendation
Apply / apply with a cover letter that addresses X / skip, and why.
```

Tell the user the verdict before spending effort on a resume for a role they should skip.
If the verdict is "poor fit", say so plainly and ask whether to continue.

## 2. Select and rewrite

**Selection rules**

- Lead each role with the atoms covering that job's must-haves. Relevance beats chronology
  *within* a role; roles themselves stay reverse-chronological.
- Recent, relevant roles get 4–6 bullets. Older ones get 1–2 or a single grouped line.
  Anything over ~15 years back collapses to a one-line "Earlier" entry unless the posting
  specifically values it.
- Cut atoms that support nothing in `analysis.md`, however impressive. A resume that
  argues everything argues nothing.
- Every bullet traces to an atom ID. If a compelling line has no atom, it does not go in —
  add it to the master profile first, then use it.

**Rewriting rules**

- Mirror the employer's vocabulary from the analysis table. Same fact, their words.
- Shape: **outcome first, then how, then scale.** "Cut cloud spend $1.2M annually by
  re-architecting core platform infrastructure across 72 clusters" — not "Was responsible
  for infrastructure re-architecture, which saved money."
- Keep every number the atom carries. Numbers are the whole reason for the atom format.
- **No em dashes.** Recruiters read them as AI-generated. Rewrite around them rather than
  swapping the character; the patterns are in [references/ats-rules.md](references/ats-rules.md).
- Past tense for past roles, present for current. No first person, no "responsible for".
- One line per bullet where possible; two absolute maximum.
- Never inflate: scope, team size, title, and dates are copied exactly from the profile.
  See the hard rules in [conventions.md](${CLAUDE_PLUGIN_ROOT}/reference/conventions.md).

Consult [references/ats-rules.md](references/ats-rules.md) for the formatting and keyword
constraints that keep the PDF parseable by applicant tracking systems and by the models
increasingly doing the first read.

## 3. Write resume.md

The renderer parses this structure exactly — keep to it:

```markdown
# Robin Alvarez
Engineering Manager · Portland, OR · robin@example.com · +1 555-0142 · linkedin.com/in/robinalvarez

## Summary
Three lines at most, written for this posting. Name the target role in the first clause.

## Experience

### Engineering Manager · Northwind Logistics
Portland, OR · Jan 2021 – Jul 2026
- Outcome-first bullet with a number.
- Another one.

## Skills
**Platform & Infrastructure:** Kubernetes, EKS, Terraform
**Leadership:** org design, incident response, hiring

## Education

### BSc, Computer Science · Anderson Institute of Technology
2002 – 2006
```

Grammar the parser recognises: `#` name (the line under it is the contact line, split on
`·`), `##` section, `### Title · Organization`, the line under a `###` is location · dates,
`-` bullets, `**Label:** items` skill rows, plain paragraphs. `**bold**`, `*italic*` and
links work inline. Sections beyond these render generically, so `## Certifications` or
`## Publications` are fine.

End the file with an evidence block naming the atoms behind each part of the document. It
survives in the markdown, never reaches the PDF, and is what makes the resume checkable:

```markdown
<!-- evidence
summary: NWL-M-10, NWL-M-11
entry Engineering Manager · Northwind Logistics: NWL-M-01, NWL-M-04
entry Earlier · Cartwheel Software, Ravensfield Consulting: CW-01, RVF-02
skills: NWL-M-03, NWL-E-06
not-claimed: Java, Go, product ownership
note: Cut the compliance bullets; governance reads heavy for a four-person team.
-->
```

**The format is strict, because a checker reads it.** One key per line. Full atom IDs only,
comma-separated: no `NWL-M-01,07`, no `NWL-M-10..14`. Each `entry` key repeats a
`### Title · Organization` heading from this document verbatim, and **every Experience entry
with bullets needs one**, so each bullet is attributable to the atoms behind it.

`not-claimed` lists what a reader might assume but the profile does not support. It is a
negative assertion the checker enforces, so a term listed there must not appear anywhere in
the document. `note` is free prose and is ignored by the checker.

Then verify before the resume goes anywhere:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" applications/<slug>
```

## 4. Render

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/resume-tailor/scripts/render_pdf.mjs" applications/<slug>/resume.md
```

Writes `resume.pdf` beside the markdown and reports the estimated page count. One page is
the target under ~10 years of experience, two above it. If it reports three, cut — do not
shrink the type below the template's floor.

Then update the row in `applications/index.md`: the fit verdict
from `match.md`, and today's date in Updated. Leave status at `drafted` — the resume existing
is not the same as it having been sent, and only `/submit` may set `applied`.

Send the PDF to the user with `SendUserFile`, then summarise in a few lines: the verdict,
which must-haves the resume leads with, which gaps remain, and anything worth putting in a
cover letter instead.
