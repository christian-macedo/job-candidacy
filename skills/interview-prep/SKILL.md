---
name: interview-prep
description: Write applications/<slug>/interviews/<n>-<round>.md — a prep brief for one round of a three-round loop (recruiter screen, hiring manager, final panel), built from the profile, the analysis, the resume that was actually sent, and every debrief captured so far. Use when the user has an interview booked, asks to prep for a screen, a hiring-manager call, a system design round, or asks what to expect or what to ask.
---

# Interview prep

Prepare **one round at a time**, for a specific date, against a specific set of people. A prep
file is a thing to be read the hour before a call, not a dossier — if it cannot be skimmed in
fifteen minutes it has failed at its job.

The three rounds are one process, not three exercises. Each one is prepped from what the last
one established, and each one is run partly to collect what the next one needs.

```
posting ─▶ analysis.md ─┐
resume/letter as sent ──┤
master-profile.md ──────┼──▶ 1-screen.md ──▶ [interview] ──▶ 1-screen-debrief.md
interview-answers.md ───┘                                          │
                                                                   ▼
                                                          2-hiring-manager.md ──▶ [interview] ──▶ 2-hiring-manager-debrief.md
                                                                                                        │
                                                                                                        ▼
                                                                                                   3-loop.md ──▶ [interview] ──▶ 3-loop-debrief.md
```

## Layout

Everything lives in `applications/<slug>/interviews/`:

| File | Written by | Contains |
|---|---|---|
| `1-screen.md` | this skill | Prep for the recruiter screen |
| `1-screen-debrief.md` | `interview-debrief` | What actually happened, and what it changes |
| `2-hiring-manager.md` | this skill | Prep for the hiring manager round |
| `2-hiring-manager-debrief.md` | `interview-debrief` | Same |
| `3-loop.md` | this skill | Prep for system design, deep technical and team fit |
| `3-loop-debrief.md` | `interview-debrief` | Same |

Extra rounds get the next number and a name for what they are: `4-skip-level.md`,
`4-founder.md`, `4-take-home.md`. Not every process has three rounds; prep the round that is
actually booked and do not invent stages the user has not been told about.

**Never edit a debrief from this skill.** Prep reads debriefs; only `interview-debrief` writes
them. Overwriting a record of what was said with a plan for what to say next destroys the one
thing in this directory that is not a guess.

## 1. Read before writing

In this order, and all of them:

1. `applications/<slug>/interviews/*-debrief.md` — **every debrief that exists.** These outrank
   the posting on any point where they disagree. A recruiter saying the team is eleven people
   beats an analysis that inferred six.
2. `applications/<slug>/analysis.md` — the must-haves, their vocabulary, the inferred priorities.
3. `applications/<slug>/match.md` — the gaps. This is the round's threat model.
4. **The resume and letter as actually sent** — `submitted/<date>/` if a snapshot exists,
   otherwise `resume.md` and `cover-letter.md`. Prep must rehearse the claims the interviewer is
   holding, not the ones the current markdown makes after later edits.
5. `profile/master-profile.md` — the atoms, including any
   the resume left out. A round has room a resume does not.
6. `profile/interview-answers.md` — the cross-role answer
   bank. Reuse an answer that already exists rather than writing a fourth version of it.

If no debrief exists for a round that has already happened, say so and offer to run
`interview-debrief` first. Prepping round 2 without a round 1 debrief means throwing away the
only intelligence the user has actually paid for.

## 2. Establish the logistics before writing a word

A prep file with the wrong time on it is worse than none. Ask, if it is not already recorded:

- **Date, start time, duration**, and time zone. Convert to every zone in play and say which is
  which. Reschedules happen; record the history rather than silently overwriting.
- **Who is in the room**, name and title. Look them up if the user provides a link, and do not
  guess at a name.
- **Format**: video, phone, on-site, shared editor, whiteboard.
- **Anything they sent in advance**: an agenda, a prep email, a take-home, a list of topics.
  This is the single highest-value input and it is routinely ignored. If they told the user what
  the round covers, the prep file is largely a matter of answering that list.

Duration drives everything else. Forty minutes is one story and their standard questions.
Ninety minutes is a different document. **Write a time budget table for anything under an hour**,
and say what gets dropped first when they run long.

## 3. Write the prep file

Follow the round reference:

- Round 1 → [references/round-1-screen.md](references/round-1-screen.md)
- Round 2 → [references/round-2-hiring-manager.md](references/round-2-hiring-manager.md)
- Round 3 → [references/round-3-loop.md](references/round-3-loop.md)

Every prep file, whichever round, opens and closes the same way:

```markdown
# <Round name>: <Company>, <Role>

**When:** <date, time in each relevant zone, duration>
**Who:** <name, title> · **Format:** <video / on-site / shared editor>
**Applied:** <date> · **Prep updated:** <date>

## What the last round established
<Empty for round 1. Otherwise, pulled from the previous debrief: what they told you, what
you learned about the role, what they flagged as coming next, and what you answered badly
and now need to answer better. Cite the debrief file.>

...round-specific sections...

## Questions to ask them
<Priority-ordered, because they will not all fit. Mark which are gates (an answer that
changes whether the user wants the job) and which are intelligence for the next round.>

## What to collect for the next round
<Explicit list. This is the round's second job and the reason the process compounds.>

## After this call
Run `/debrief <slug>` while it is fresh. The next round is prepped from that file.

<!-- evidence ... -->   ← see step 4; the checker requires it
```

## 4. Cite what will be said

Every prep file ends with an evidence block, for the same reason a resume carries one: a
rehearsed answer is a claim, said out loud, to someone who can check it. `verify.mjs` parses
this, so the grammar is strict.

```markdown
<!-- evidence
story The two-minute pitch: NWL-M-41, NWL-M-42
story Incident load: NWL-M-07, NWL-M-08
scenario Underperformer: NWL-M-26
no-atom: 2. Compensation, 4. Why you left Northwind
boundary: Postgres, hands-on
debrief: 1-screen-debrief.md
note: free prose, ignored by the checker
-->
```

One key per line, full atom IDs only, comma-separated.

- **`story` and `scenario`** repeat a heading from this file verbatim, `##` or `###`, whichever
  is innermost. **Every section containing a blockquote needs one**, because a blockquote is
  what the user will actually say.
- **`no-atom`** declares a section whose rehearsed answer rests on nothing in the profile: work
  authorization, notice period, a compensation band from `match.md`. These are circumstances,
  not accomplishments, and citing an atom for them would be a lie about where the fact came
  from. The heading must exist and must contain a blockquote, so the exemption stays checkable.
- **`boundary`** lists the gaps this round must name out loud. It is `not-claimed` inverted: a
  resume must never mention the gap, a prep file must, and the checker enforces that each term
  actually appears. Take the terms from `match.md`.
- **`debrief`** lists every debrief for an earlier round. **Leaving one out is a FAIL**, which
  is how the "prep reads every debrief" rule is enforced rather than merely stated. Empty for
  round 1.

Then verify before the round:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" applications/<slug>
```

A `prep-numbers` warning means a number is about to be spoken that appears in no cited atom, no
debrief, and nothing that was sent. Sometimes the citation is incomplete and sometimes the
number is wrong; find out which before the call, not during it.

## 5. Rules

- **Never invent.** Same hard rule as the resume, see [conventions.md](${CLAUDE_PLUGIN_ROOT}/reference/conventions.md). A story
  in a prep file traces to an evidence atom or to a debrief. If a round needs an accomplishment
  with no atom, the fix is to add the atom to the master profile first, and to tell the user that
  is what happened. Do not let a rehearsed line be the first place a fact exists.
- **Never rehearse past what was sent.** If the resume claimed six engineers, the prep says six.
  A prep file that quietly upgrades the claim is how a candidate contradicts their own paperwork
  under follow-up.
- **Write it to be spoken.** Short sentences, one idea each. Mark the length of each answer in
  seconds. The voice convention from `profile/interview-answers.md`
  applies: **"I" for decisions, framing, funding and accountability; "the team" for
  implementation.** Interviewers discount "we" because it hides which one the user was.
- **State boundaries before they are found.** For every gap in `match.md` that this round is
  likely to probe, write the honest sentence that names the limit, and the true adjacent evidence
  that goes after it. Volunteering the boundary is what makes the rest credible.
- **Number the priorities.** Anything presented as a flat list will be worked through in order
  and the last three items will never be reached. Say which two matter.
- **No em dashes in anything that leaves the user's mouth in writing** — a follow-up email, a
  take-home, a written answer field. Spoken prep prose is exempt because nobody reads it but the
  user. See [ats-rules.md](../resume-tailor/references/ats-rules.md).
- **Do not pad.** A prep file that repeats the resume back is worthless. Everything in it should
  be something the user would otherwise have had to work out live.

## 6. Register it

Update the row in `applications/index.md`: set status to the
round that is now booked (`screen`, `hm-round`, `final-round`), put the date and duration in the
status cell the way the existing rows do, and refresh Updated.

Then tell the user, in a few lines: the one thing that decides this round, the two questions
they should not leave without asking, and the gap most likely to be probed.
