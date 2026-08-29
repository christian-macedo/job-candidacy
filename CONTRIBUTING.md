# Contributing

## The one rule that is not negotiable

**No real personal data, ever.** Not in an example, not in a test fixture, not in a commit
message. Every example in this repository uses the fictional persona: Robin Alvarez, Northwind
Logistics, Cartwheel Software, Ravensfield Consulting, Anderson Institute of Technology, and
Helios Data as the employer being applied to. Atom IDs are `NWL-*`, `CW-*` and `RVF-*`.

If you are using this plugin for your own job hunt, your `profile/` and `applications/` live in a
different, private repository. Do not open a pull request from it.

## Before you push

```bash
cd example && node ../skills/application-verify/scripts/verify.mjs --all
```

Must report `All checks passed.` CI runs exactly this.

If you changed the renderer or the resume grammar, also confirm the example still renders inside
its page limits:

```bash
node skills/resume-tailor/scripts/render_pdf.mjs \
  example/applications/helios-data-engineering-manager-platform/resume.md \
  -o /tmp/resume.pdf
```

Two pages for a resume, one for a letter. The script prints the count and warns past the limit.

Do not commit a PDF beside a markdown file in `example/`. `stale-pdf` compares modification
times, and a fresh clone sets them all at once. The example's PDFs live under `submitted/`, which
that check does not read.

## Adding a check to verify.mjs

A check earns its place by being **decidable**: given the files, it has one answer, the same
answer every run. Anything that needs a reader belongs in the rubric in
`skills/application-verify/SKILL.md` instead.

- **FAIL** means the document is wrong. It blocks.
- **warn** means worth an answer, where the answer may legitimately be "this is fine".
- A warning that fires on correct documents is a bug in the check. Five identical warnings across
  seven applications means the rule is miscalibrated, not that the documents are bad.

Every new check needs a row in `skills/application-verify/references/checks.md` saying what it
catches and why it exists, and a case in `example/` that exercises it.

## Editing a skill

- Skills invoke scripts through `${CLAUDE_PLUGIN_ROOT}`, never through a repo-relative path. The
  plugin is installed into a cache directory; `.claude/skills/...` does not exist there.
- Skills refer to the user's data as plain paths (`profile/master-profile.md`), never as markdown
  links. A link resolves inside the plugin cache, which is the wrong place.
- Cross-cutting rules live in `reference/conventions.md`. Link to it rather than restating them,
  so they cannot drift between skills.
- No em dashes in anything that ends up in a document a recruiter reads. The checker fails on
  them, and that includes the examples inside a SKILL.md.

## Scope

This plugin is opinionated on purpose. Two things it deliberately does not do:

- **Apply for anything automatically.** Every send is a human action.
- **Compare applications to each other.** Every document is checked against the profile, and the
  profile is the shared reference; consistency follows from fidelity to the same source.

A change that loosens the citation requirement needs an argument, not just a use case. The whole
value of the pipeline is that a line in a PDF traces back to something that actually happened.
