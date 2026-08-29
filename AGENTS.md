# AGENTS.md

Notes for a coding agent working in this repository. Humans deciding *whether* to contribute
want [CONTRIBUTING.md](CONTRIBUTING.md); this is for an agent about to edit files.

## What this repository is

A **Claude Code plugin**, not an application. There is no build and no server. It ships
markdown that instructs an agent, plus three scripts those instructions call.

```
.claude-plugin/plugin.json   manifest. no marketplace.json here on purpose: distribution
                             lives in the tousledmonkey marketplace, a separate repository
commands/                    thin slash-command entry points. each picks a target, then defers
skills/<name>/SKILL.md       the actual instructions
skills/<name>/references/    depth a skill loads only when it needs it
skills/<name>/scripts/       verify.mjs, render_pdf.mjs, parse_resume.mjs, linkedin_export.py
reference/conventions.md     rules shared across skills. the single home for them
example/                     a worked application, and the test fixture
```

## The rule that gets you rejected

**No real personal data, anywhere, ever.** Not in an example, not in a fixture, not in a commit
message. Every example uses one fictional persona:

> Robin Alvarez · Northwind Logistics (`NWL-*`) · Cartwheel Software (`CW-*`) ·
> Ravensfield Consulting (`RVF-*`) · Anderson Institute of Technology ·
> applying to Helios Data, Lisbon

Reuse those names. Do not invent a second persona, and do not substitute a real company for
flavour. This repository was extracted from a private one, and a real name, published email
address and phone number were sitting in a skill example when it happened.

## Verify before you finish

```bash
cd example && node ../skills/application-verify/scripts/verify.mjs --all
```

Must print `All checks passed.` CI runs exactly this, plus a scrub gate over
`skills commands reference example`.

If you touched the renderer, the resume grammar, or the example documents:

```bash
node skills/resume-tailor/scripts/render_pdf.mjs \
  example/applications/helios-data-engineering-manager-platform/resume.md -o /tmp/r.pdf
```

Two pages for a resume, one for a letter. The script prints the count and warns past the limit.

To load your working tree in Claude Code instead of an installed copy:

```bash
claude --plugin-dir .
```

## Structural rules that are easy to break

- **Scripts are invoked through `${CLAUDE_PLUGIN_ROOT}`**, never a repo-relative path. Installed,
  this repository sits in a cache directory; `.claude/skills/...` does not exist there.
- **Refer to the user's data as plain paths** (`profile/master-profile.md`), never as a markdown
  link. A link resolves inside the plugin cache, which is the wrong place. Links *within* a skill
  and from a command to a skill are fine.
- **`verify.mjs` resolves the project from `CLAUDE_PROJECT_DIR` or the working directory**, never
  from its own location. It has to run against whatever project invoked it.
- **Cross-cutting rules live in `reference/conventions.md`.** Link to it. Restating a rule inside
  a skill forks it.
- **No em dashes** in anything that reaches a document a recruiter reads, including the examples
  inside a SKILL.md. `verify.mjs` fails on them.
- **Do not commit a PDF next to a markdown file in `example/`.** The `stale-pdf` check compares
  modification times and a fresh clone sets them all at once. The example's PDFs live under
  `submitted/`, which that check does not read.

## Changing verify.mjs

A check belongs there only if it is **decidable**: given the files, one answer, the same answer
every run. Anything needing a reader belongs in the rubric in
`skills/application-verify/SKILL.md`.

`FAIL` means the document is wrong and blocks. `warn` means worth an answer, where the answer may
be "this is fine". A warning that fires on correct documents is a bug in the check.

Every new check needs a row in `skills/application-verify/references/checks.md` explaining what it
catches and why, and a case in `example/` that exercises it.

## Releasing

Bump `version` in `plugin.json`, then in this repository:

```bash
claude plugin tag --push
```

It creates `job-candidacy--v<version>` and refuses if the version disagrees with the marketplace
entry. Then bump `ref` and `version` in the marketplace index repository.
