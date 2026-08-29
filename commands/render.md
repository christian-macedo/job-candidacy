---
description: Re-render a tailored resume.md to PDF after hand edits
argument-hint: "[slug or path to resume.md / cover-letter.md]"
allowed-tools: Bash(node:*), Bash(ls:*), Glob, SendUserFile
---

Re-render a resume to PDF. No rewriting, no re-tailoring — just run the renderer over the
markdown as it currently stands.

Target: `$1`

- A path to a `.md` file → use it directly.
- A slug (e.g. `stripe-engineering-manager`) → render **both** `applications/$1/resume.md`
  and `applications/$1/cover-letter.md`, whichever exist.
- Empty → list `applications/*/{resume,cover-letter}.md` and use the most recently modified
  one, saying which you picked.

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/resume-tailor/scripts/render_pdf.mjs" <file.md>
```

Letter mode is inferred from the `cover-letter` filename; pass `--letter` if a letter lives
under a different name. Report the page count the script prints — the limit is two pages for
a resume, one for a letter — and send the PDFs back with `SendUserFile`.

If the markdown has drifted from the grammar in
[resume-tailor/SKILL.md](../skills/resume-tailor/SKILL.md) — a missing `### Title — Org`
line, a contact line that moved — the renderer will silently drop that content. Skim the
markdown against the grammar first and flag anything that looks off before rendering.
