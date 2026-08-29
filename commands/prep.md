---
description: Prepare for one round of an interview loop, built from the last round's debrief
argument-hint: "<slug> [round: 1|2|3 or screen|hm|loop] [when]"
allowed-tools: Bash(ls:*), Bash(mkdir:*), Bash(date:*), Glob, Grep, Read, Write, Edit
---

Write the prep brief for one interview round with the
[interview-prep](../skills/interview-prep/SKILL.md) skill.

Target: `$1` · Round: `$2` · Timing: `$3`

- **Slug** → that application. Empty → the most recent row in
  `applications/index.md` with a live interview status, saying
  which was picked.
- **Round** → `1`/`screen`, `2`/`hm`, `3`/`loop`, or a name for an extra round. Empty → infer
  from what already exists in `applications/$1/interviews/`: the next round after the last one
  with a debrief. Say which round was inferred before writing.
- **Timing** → the date, time and duration if given. If not already recorded, **ask** rather
  than writing a prep file with no date on it.

## Before writing

Read every existing debrief in `applications/$1/interviews/`. Where a debrief and the posting
disagree, the debrief wins. If the previous round has happened but has no debrief file, stop and
offer `/debrief $1` first, because prepping round 2 from the posting throws away the intelligence
the screen was run to collect.

```bash
ls applications/$1/interviews/ 2>/dev/null || echo "no interviews yet"
```

Then follow the round reference in the skill, and rehearse against the resume as **sent**
(`submitted/<date>/` where a snapshot exists), not the current markdown.

## After writing

Verify, because a prep file is checked by the same script as everything else:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" applications/$1
```

Fix any `FAIL` before handing the file over. A `prep-numbers` warning means a number is about to
be said out loud that appears nowhere on the record; settle whether the citation or the number
is wrong.

Then update the row in `applications/index.md` with the round status and date, and report three
things and nothing else: the one thing that decides this round, the two questions not to leave
without asking, and the gap most likely to be probed.
