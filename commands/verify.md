---
description: Check an application against the profile and the analysis before it is sent
argument-hint: "[slug, or --all]"
allowed-tools: Bash(node:*), Bash(ls:*), Glob, Read, Write, Edit
---

Verify `$1` with the [application-verify](../skills/application-verify/SKILL.md) skill: run
the deterministic checks, then read the documents against the evidence they cite, and write
`applications/$1/review.md`.

Target: `$1`

- A slug → verify that application.
- `--all` → run the script across every application and report the summary plus atom
  coverage. Do **not** write a `review.md` for each; the reading pass is per-application and
  the user should choose which one to spend it on.
- Empty → use the most recently modified `applications/*/resume.md`, saying which you picked.

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" $1
```

Then follow the rubric in the skill. Report the verdict and the must-fix findings in chat;
the full detail goes in `review.md`.

**Do not fix anything.** This command reports. If the user wants repairs, that is
`resume-tailor` or `cover-letter`, run afterwards against the review.
