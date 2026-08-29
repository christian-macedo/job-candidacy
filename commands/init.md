---
description: Scaffold a new job-candidacy project in the current directory
argument-hint: "[nothing; run it in an empty or existing project]"
allowed-tools: Bash(ls:*), Bash(git:*), Glob, Read, Write, Edit
---

Set up the file layout the rest of this plugin expects, in the current working directory.

Read [conventions.md](${CLAUDE_PLUGIN_ROOT}/reference/conventions.md) first: it defines the
layout, and this command's only job is to create it.

## Before writing anything

```bash
ls -a
```

**Create only what is absent.** If `profile/master-profile.md` already exists, leave it alone and
say so. This command must be safe to run twice, and safe to run inside a project that is already
half set up. Never overwrite a file that has content in it.

## What to create

1. **`profile/master-profile.md`** — a stub carrying the headings `profile-import` writes into,
   and nothing invented. The `## Contact` section needs a `- **Email:**` line even if it is a
   placeholder, because that line is what tells the checker which address is publishable.
   Sections: `## Contact`, `**Target roles:**`, `**Summary (long):**`, `## Experience`,
   `## Skills inventory`, `## Education`, `## Open questions`.

2. **`profile/interview-answers.md`** — the header and the voice convention, with no answers yet.

3. **`profile/sources/.gitkeep`** — the directory raw exports land in.

4. **`applications/index.md`** — the table header and the status vocabulary, no rows:

   ```
   | Slug | Company | Role | Location | Fit | Status | Sent | Updated |
   |---|---|---|---|---|---|---|---|
   ```

   The status column matters to the checker: `applied`, `screen`, `hm-round`, `final-round`,
   `offer` and `rejected` all assert the documents were sent, and each one requires a
   `submitted/<date>/` snapshot to exist.

5. **`.gitignore`** — append, do not replace, these lines if they are not already present:

   ```
   profile/sources/*
   !profile/sources/.gitkeep
   node_modules/
   .DS_Store
   ```

   **Say out loud why:** `profile/sources/` holds LinkedIn exports and old resumes. A LinkedIn
   export contains other people's personal data as well as the user's.

6. **`CLAUDE.md`** — only if absent. Short: the layout table, the `<slug>` convention, and a
   pointer to `${CLAUDE_PLUGIN_ROOT}/reference/conventions.md` for the hard rules. Do not copy
   the rules into it; they would drift.

## Then

Confirm the scaffold works before handing it over:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" --all
```

An empty project reports no applications and no failures. If it reports that no job-candidacy project
was found, the scaffold is in the wrong directory; say which directory was used.

Finish by telling the user the one next step and only that: drop a LinkedIn export, an old
resume or a performance review into `profile/sources/` and ask to import it, which runs the
`profile-import` skill. A scaffold with no profile in it cannot tailor anything, so do not list
the later steps yet.

**Do not offer to commit.** Whether this becomes a git repository, and whether it is private, is
the user's call and worth them making deliberately.
