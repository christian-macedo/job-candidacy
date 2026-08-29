---
name: interview-debrief
description: Capture what actually happened in an interview into applications/<slug>/interviews/<n>-<round>-debrief.md, then propagate what it changes — role intel into analysis.md, reusable answers into profile/interview-answers.md, missing accomplishments into master-profile.md as proposed atoms. Use right after an interview, when the user says how a call went, shares interview notes, or asks to log or debrief a screen, a hiring-manager call or a panel.
---

# Interview debrief

Turn a call that just happened into the input for the next one. This runs **immediately after**
an interview, while the user still remembers what was said, and it is the step that makes a
three-round process compound instead of three separate performances.

A debrief has two halves. The record of what happened, which is written once and then left alone,
and the propagation, which pushes what was learned into the files that outlive this application.

## 1. Capture

Ask the questions below. **Accept a raw brain-dump instead** — if the user pastes unstructured
notes or just talks, extract the same fields from it and only ask about what is genuinely missing
and genuinely matters. Someone who has just finished a ninety-minute panel should not be
interrogated.

1. **How did it go**, in a sentence. Their read, before any analysis.
2. **Who was actually in the room**, and did that match what was expected.
3. **What did they ask.** As many as the user remembers, in any order. This is the highest-value
   field and worth one follow-up prompt if the answer is thin.
4. **What did you answer badly**, or wish you had answered differently.
5. **What did you learn about the role, the team, the company** that you did not know.
6. **What did they say about compensation, level, logistics, or work authorization**, if anything.
7. **What did they say about the next round**: format, who, when, what it covers.
8. **Anything that felt off.** Hesitations, a question asked twice, an answer they did not like.
   The user's instinct here is usually right and is usually the agenda of the next round.

Ask them in one message as a short list, not one at a time. Missing answers are recorded as
"not captured" rather than filled in with a plausible guess.

## 2. Write the debrief

To `applications/<slug>/interviews/<n>-<round>-debrief.md`:

```markdown
# Debrief: <round name>, <Company>

**Held:** <date, time, duration actually taken> · **Debriefed:** <date>
**Who:** <names and titles> · **Format:** <what it was>
**Read:** <the user's one-sentence assessment, in their words>

## What they asked
| Question | How it was answered | Verdict |
|---|---|---|
| … | … | landed / adequate / badly |

## What was learned
Facts, one per line, each marked as **stated** (they said it) or **inferred** (the user read it
between the lines). Never blur the two: a stated team size is a fact the next round can be built
on, an inferred one is a guess that will embarrass the user if repeated back as certainty.

## Corrections to the analysis
Where what they said contradicts `analysis.md` or the posting. The interview wins.

## What to fix before the next round
The answers that went badly, and what the better version is. This is the section round N+1's
prep opens with.

## Feeds forward
Explicit, addressed to the next round's prep:
- Format and topics of the next round, as stated.
- What they probed, and will probe harder.
- What they seemed unsure about.
- What is still not known and needs to be asked.

## Open questions
Anything the user meant to ask and did not.
```

**Every line under `## What was learned` must be marked `**stated**` or `**inferred**`.**
`verify.mjs` fails the file otherwise, and the check is the one the whole downstream rests on: a
stated team size is a fact the next round can be built on, an inferred one is a guess, and a
week later they are indistinguishable unless they were marked at capture time. The failure it
prevents is the user repeating their own inference back to an interviewer as something they
were told.

**A debrief carries no evidence block.** Every other document in this repo is checked against
the master profile; a debrief is the one place new information legitimately enters, so pointing
the atom checks at it would only produce failures for facts that are true.

**This file is a record. Do not revise it later to match what happened next.** If a fact turns
out to be wrong, the correction goes in the next debrief or in `analysis.md`, with a date. An
edited record of what was said is worth nothing. `verify.mjs` warns (`debrief-frozen`) when a
committed debrief has uncommitted edits, so revising one is at least a visible decision.

Then verify, which also checks the prep files this debrief will feed:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/application-verify/scripts/verify.mjs" applications/<slug>
```

## 3. Propagate

The debrief is not finished until what it taught has been pushed out of the application directory.
Do all three, and report what changed.

### Role intel to `analysis.md`

Where the interview corrected or extended the posting — real team size, the actual scope, the
tech stack, the band, the process, a requirement that turned out to be soft — update
`applications/<slug>/analysis.md`. Mark every such line with its source and date:

```markdown
**Team size:** 11, not the 6 inferred from the posting. *(Stated by recruiter, 2026-08-25.)*
```

Do not delete the original inference. Showing that the posting implied one thing and the recruiter
said another is itself information about how the posting was written.

If the correction is large enough to change the fit assessment, say so and offer to re-run
`resume-tailor` against the corrected analysis. Do not silently rewrite `match.md`.

### Reusable answers to `profile/interview-answers.md`

A question that would be asked at any company, with an answer that worked, belongs in the answer
bank rather than in one application's directory. So does an answer that failed, with what the
better version is. Follow the file's existing shape: the question as a `##` heading, the atoms
used, the answer written to be spoken in numbered parts with a time estimate on each.

Company-specific material stays in the application directory. The test is whether the next
application would benefit.

### Missing evidence to `profile/master-profile.md`

If the interview asked about something real that has no evidence atom, that is a gap in the
canonical record, not just an awkward moment. Draft the atom in the existing format, with a new
ID in the right series, and **show it to the user for confirmation before writing it.** The
master profile is the one file where an unverified fact does real damage, because everything
downstream cites it.

```
- [NWL-M-43] <accomplishment, with the number> | skills: …
```

Never write an atom from what the user said under pressure in an interview without confirming it
afterwards. Interview answers round numbers up.

## 4. Update the index and hand off

Update the row in `applications/index.md`: the status if the
process moved (`hm-round`, `final-round`, `offer`, `rejected`), the next date in the status cell,
and today's date in Updated. If the round ended the process, say so in the Notes section with
what the reason actually was, since that is the most useful thing in the file for the next
application.

Then report, in a few lines: the two or three things that change the next round, anything that
changes whether the user wants this job, and an offer to run `/prep <slug>` for the next round.

If the process ended, skip the offer and say what the pipeline should learn from it instead.
