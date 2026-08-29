---
description: Snapshot the exact PDFs sent for an application and mark it applied
argument-hint: "<slug> [where it was sent]"
allowed-tools: Bash(node:*), Bash(mkdir:*), Bash(cp:*), Bash(ls:*), Bash(date:*), Read, Edit, Glob
---

Freeze what was actually sent for `$1`, so there is a permanent record of the version a
recruiter is holding.

## Steps

1. **Re-render first**, so the PDFs match the current markdown:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/skills/resume-tailor/scripts/render_pdf.mjs" applications/$1/resume.md
   node "${CLAUDE_PLUGIN_ROOT}/skills/resume-tailor/scripts/render_pdf.mjs" applications/$1/cover-letter.md
   ```

   Report any warning the renderer prints (page count, em dashes) and **stop if either fires**
   — a snapshot of a flawed document is worse than no snapshot. Fix, then continue.

2. **Snapshot** into a dated directory. Never overwrite an existing one; if today's already
   exists, append `-b`, `-c` and note why there were two sends.

   ```bash
   mkdir -p applications/$1/submitted/$(date +%F)
   cp applications/$1/resume.pdf applications/$1/cover-letter.pdf applications/$1/submitted/$(date +%F)/
   ```

3. **Write `NOTES.md`** in that directory: where it was sent (job board, referral, direct
   email), the date, what was entered in any screening fields (work authorization answers
   especially), and anything said in a free-text box. Future-you will not remember which
   sponsorship answer was given.

4. **Update `applications/index.md`**: set status to `applied`,
   fill the Sent column with the snapshot date, refresh Updated.

5. **Commit**, so the snapshot is in history as well as on disk:

   ```bash
   git add -A applications/$1 && git commit -m "Submit application: $1"
   ```

   Ask before committing if the working tree has unrelated changes.

## Rules

- **Never regenerate a PDF inside `submitted/`.** That directory is immutable. Everything
  outside it stays live and editable.
- If the user says a version was sent earlier and no snapshot exists, say so plainly rather
  than back-dating a directory from the current markdown — the current file has almost
  certainly drifted from what was sent.
