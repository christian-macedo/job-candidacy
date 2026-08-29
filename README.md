# job-candidacy

A Claude Code plugin for producing tailored resumes, cover letters and interview prep from a
single canonical record of your career, where **every claim in a generated document cites the
evidence it came from** and a checker enforces it.

The plugin is the process. Your career record and your applications are yours and stay in your
own repository; nothing personal lives here.

## Install

Add the marketplace once:

```bash
claude plugin marketplace add christian-macedo/claude-plugins
```

Then install the plugin and restart Claude Code:

```bash
claude plugin install job-candidacy@tousledmonkey
```

Make a directory for your job hunt, open Claude Code in it, and scaffold the layout:

```bash
/job-candidacy:init
```

Later, to pick up a new version:

```bash
claude plugin update job-candidacy
```

### Prerequisites

| | |
|---|---|
| **Node** | Ships with Claude Code. The plugin's one dependency, `puppeteer-core`, installs itself when the plugin is cached. Nothing to do. |
| **A Chromium browser** | Required to render PDFs: Google Chrome, Chromium or Microsoft Edge. Set `CHROME_PATH` if yours is somewhere the plugin will not find it. |
| **Python 3** | Only needed to parse a LinkedIn data export. Everything else works without it. |

### What it costs you

The plugin adds roughly 1,100 tokens to every session, which is the skill and command
descriptions Claude reads to know when to reach for them. `claude plugin details job-candidacy`
prints the current number. If you are not job hunting, `claude plugin disable job-candidacy`
gets it back without uninstalling.

## The pipeline

```
sources (LinkedIn export, old resumes, reviews)
   │  profile-import skill
   ▼
profile/master-profile.md          ← the one source of truth. Superset of everything.
   │
   │            job posting (URL or pasted text)
   │                 │  job-analyze skill
   │                 ▼
   │            applications/<slug>/analysis.md
   │                 │
   └────────┬────────┘
            │  resume-tailor skill
            ▼
   applications/<slug>/match.md    ← fit assessment, honest gaps
   applications/<slug>/resume.md   ← tailored, evidence-cited
            │
            ├─ /job-candidacy:render ──▶ resume.pdf
            │
            │  cover-letter skill
            ▼
   applications/<slug>/cover-letter.md
            │
            │  application-verify skill (/job-candidacy:verify)
            ▼
   applications/<slug>/review.md   ← script findings + a read against the evidence
            │
            │  /job-candidacy:submit
            ▼
   applications/<slug>/submitted/<date>/
            │
            │  interview-prep skill (/job-candidacy:prep)
            ▼
   applications/<slug>/interviews/1-screen.md
            │  [the interview happens]
            │  interview-debrief skill (/job-candidacy:debrief)
            ▼
   applications/<slug>/interviews/1-screen-debrief.md
            │           │
            │           ├──▶ analysis.md          (role intel, dated and sourced)
            │           ├──▶ interview-answers.md (answers reusable at any company)
            │           └──▶ master-profile.md    (proposed atoms, confirmed first)
            ▼
   2-hiring-manager.md → 2-hiring-manager-debrief.md → 3-loop.md → 3-loop-debrief.md
```

## Evidence atoms

`master-profile.md` stores accomplishments as atoms with stable IDs:

```
- [NWL-02] Cut weekly on-call pages from 90 to 22 by ... | skills: incident response, observability
```

Tailored documents end with an evidence block citing the atoms behind each part:

```
<!-- evidence
summary: NWL-M-02, NWL-E-01
entry Engineering Manager · Northwind Logistics: NWL-M-01, NWL-M-02
not-claimed: Terraform, Java
-->
```

`verify.mjs` parses that block, so a citation is a control rather than a comment. It checks that
every cited atom exists, that every bullet's numbers appear in the atoms its entry cites, that
dates match the profile exactly, that nothing in `not-claimed` appears in the body, and about
twenty other things. Full list in
[skills/application-verify/references/checks.md](skills/application-verify/references/checks.md).

## Why it is shaped this way

**Verification runs in a fresh turn, not at the end of tailoring.** Checking a draft in the
context that produced it recovers the reasoning that justified each choice, which is the opposite
of what a review is for.

**The letter is downstream of the resume**, so it argues from evidence the resume already
selected and can never introduce a claim the resume does not support.

**A round is never prepped from the posting alone once an earlier round has happened.** Prep reads
every debrief first, and where a debrief and the posting disagree the debrief wins: what a
recruiter said out loud beats what a posting implied. The checker fails a prep file for round N+1
when round N has no debrief.

**Debriefs are written once and never revised.** Corrections go forward, dated, into the next
debrief or into `analysis.md`. A record edited to match what turned out to be true is worth
nothing as a record.

## Worked example

[`example/`](example/) is a complete, fictional application for one Robin Alvarez: profile with
atoms, posting, analysis, match, resume, letter, a screen prep and its debrief, and the PDFs as
sent. It is also the fixture CI runs the checks against, so every rule in `checks.md` is a tested
rule.

```bash
cd example && node ../skills/application-verify/scripts/verify.mjs --all
```

## Your data is not this repository

The plugin generates files under `profile/` and `applications/` in **your** project. Those hold
your contact details, your employment history, what you told a recruiter about your work
authorization, and what an interviewer said to you in confidence. `profile/sources/` additionally
holds LinkedIn exports, which contain *other people's* personal data.

Keep that project private and separate from this one. Never open a pull request here from a
repository that contains it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: examples use the fictional persona,
never a real one, and a new check has to be decidable from the files alone.

## License

MIT.
