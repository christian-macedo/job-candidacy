---
description: Log what actually happened in an interview and feed it into the next round
argument-hint: "<slug> [round] [notes, or paste them after]"
allowed-tools: Bash(ls:*), Bash(date:*), Glob, Grep, Read, Write, Edit
---

Capture the round that just happened with the
[interview-debrief](../skills/interview-debrief/SKILL.md) skill.

Target: `$1` · Round: `$2` · Notes: `$3`

- **Slug** → that application. Empty → the application with the most recent interview date in
  `applications/index.md`, saying which was picked.
- **Round** → infer from the newest prep file in `applications/$1/interviews/` that has no
  debrief beside it. Say which was inferred.
- **Notes** → if the user pasted anything, treat it as the brain-dump and extract the fields
  from it. Only ask about what is missing **and** matters. Otherwise ask the capture list from
  the skill, in one message.

```bash
ls applications/$1/interviews/ 2>/dev/null || echo "no interviews yet"
```

Write `applications/$1/interviews/<n>-<round>-debrief.md`, then propagate: role intel into
`analysis.md` with a source and date, reusable answers into
`profile/interview-answers.md`, and any missing
accomplishment as a **proposed** atom for `master-profile.md`, shown to the user before it is
written.

Every line under `## What was learned` is marked `**stated**` or `**inferred**`, or the file
fails verification. Never guess which one a fact is; ask.

**Do not revise an existing debrief.** Corrections go forward, into the next debrief or the
analysis, dated. The value of the file is that it records what was said, not what turned out
to be true.

Then verify:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" applications/$1
```

Finish by updating the index row and offering `/prep $1` for the next round.
