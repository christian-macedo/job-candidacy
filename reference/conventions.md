# Conventions

The rules every skill in this plugin depends on. Skills link here rather than restating them,
so this file is the one place they are defined.

## Layout

The plugin expects a project laid out like this. `/job-candidacy:init` creates it.

| Path | Contents |
|---|---|
| `profile/master-profile.md` | Canonical career record. Never tailored, never trimmed. |
| `profile/sources/` | Raw inputs (LinkedIn zip, old resumes, review PDFs). **Gitignore this** — it contains PII, including other people's. |
| `profile/interview-answers.md` | Cross-role answer bank. Answers that would work at any company, promoted out of debriefs. |
| `applications/index.md` | Status of every application. One row per role. The answer to "where does each one stand". |
| `applications/<slug>/` | One directory per role: `posting.md`, `analysis.md`, `match.md`, `resume.md`/`.pdf`, `cover-letter.md`/`.pdf`, and any `outreach.md` drafts. |
| `applications/<slug>/submitted/<date>/` | **Immutable.** The exact PDFs a recruiter received, plus `NOTES.md`. Written by `/job-candidacy:submit`, never regenerated. |
| `applications/<slug>/interviews/` | One prep file and one debrief file per round: `1-screen.md`, `1-screen-debrief.md`, `2-hiring-manager.md`, and so on. Extra rounds take the next number and a name (`4-skip-level.md`). |

`<slug>` is `company-role-title` in kebab-case, e.g. `stripe-engineering-manager-payments`.

## Evidence atoms

`master-profile.md` stores accomplishments as **evidence atoms**, each with a stable ID:

```
- [NWL-04] Cut p95 checkout latency 40% (820ms → 490ms) by ... | skills: performance, Go, observability
```

ID format: `<ORG-ABBREV>-<NN>`, assigned once and never reused or renumbered. Where one
organization covers two distinct kinds of work, a middle letter splits them (`NWL-E-01` for
engineering, `NWL-M-01` for management); the checker treats the whole string as the ID either
way.

Tailored resumes cite the atoms they draw from, so every line in a PDF is traceable back to
something the user actually did. Adding new facts at tailor time is not allowed: if a role needs
evidence that has no atom, the fix is to add the atom to the master profile first.

## Evidence blocks

Every generated document ends with an **evidence block** recording those citations. It survives
in the markdown, never reaches the PDF, and is what makes the document checkable:

```
<!-- evidence
summary: NWL-M-10, NWL-M-11
entry Engineering Manager · Northwind Logistics: NWL-M-01, NWL-M-04
skills: NWL-M-03, CW-06
not-claimed: Java, Go
note: free prose, ignored by the checker
-->
```

One key per line, full IDs only, comma-separated: no `NWL-M-01,07`, no `NWL-M-10..14`. Each
`entry` key repeats a `### Title · Organization` heading from the document verbatim, and every
Experience entry with bullets needs one.

Cover letters key by paragraph (`p1`, `p2`, …) instead of by entry. Prep files key by rehearsed
answer (`story <name>:`, `scenario <name>:`) and declare `no-atom:` for the questions that rest on
nothing in the profile. Debriefs carry no evidence block at all: they are the one place new
information legitimately enters, and are checked instead for marking each learned fact
`**stated**` or `**inferred**`.

The format is strict because `verify.mjs` parses it. Loose citations cannot be bound to a specific
bullet, and a citation nothing can check is a comment, not a control.

## Hard rules

1. **Never invent.** No metric, title, date, or technology appears in a tailored resume unless it
   exists in `master-profile.md`. Gaps get reported in `match.md`, not papered over.
2. **Rephrasing is allowed, inflation is not.** "Led a team of 6" may become "Managed a
   6-engineer team"; it may not become "Led a 20-person org".
3. **The master profile is append-mostly.** Imports merge into it and never silently drop
   existing content.
4. **Third-party data stays out.** A LinkedIn export contains connections' and correspondents'
   personal data. Only the user's own career records are read; `Connections.csv`, `messages.csv`
   and `Invitations.csv` are never ingested.
5. **No em dashes (—) in anything a recruiter reads** — resumes, cover letters, outreach drafts,
   and the profile prose they are built from. Recruiters read them as an AI tell. Rewrite the
   sentence rather than swapping the character; see
   [ats-rules.md](${CLAUDE_PLUGIN_ROOT}/skills/resume-tailor/references/ats-rules.md). En dashes
   in date ranges are fine. Title and organization are separated by a middot: `Title · Organization`.
6. **Debriefs are written once and never revised.** Corrections go forward, dated, into the next
   debrief or into `analysis.md`. A record edited to match what turned out to be true is worth
   nothing as a record.
