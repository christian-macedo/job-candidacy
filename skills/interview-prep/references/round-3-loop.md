# Round 3: system design, deep technical, and team fit

**What this round is.** The round where the experience gets tested rather than described. Three
distinct sections, usually with different interviewers, scored separately:

1. **System design.** A bounded problem, worked live. They are watching the method, not marking
   an answer.
2. **Deep technical.** Targeted probes on the specific claims made in rounds 1 and 2, run by
   someone who knows the domain properly.
3. **Behavioral and team fit.** Whether this person works the way the team works. It reads as the
   soft section and it is frequently the one that fails people.

**This round is prepped almost entirely from round 2.** The hiring manager will have said what
the format is, what domain the design sits in, and which claims they were unsure about. If
`2-hiring-manager-debrief.md` does not answer those, say so plainly at the top of the file and
mark the sections that are consequently guesswork, rather than writing confident prep on an
invented format.

## Sections to write

### What round 2 established

- The format, per section: who, how long, what tool.
- The claims the manager probed, and which ones survived.
- What the manager said they were unsure about. **Assume that is the agenda.**
- The values and behaviours the manager named, in their words. The fit section is scored against
  those, not against the company's published values page.

### System design

Do not write a solution. Write a **method**, plus the material the user actually has.

- **The likely prompt or prompts.** Derive them from the team's real domain: what the posting
  describes, what the manager said the team is building, the product itself. Two or three
  candidate prompts, not a survey.
- **The method, as a sequence to say out loud.** Requirements and what is explicitly out of
  scope, then scale numbers agreed with the interviewer, then the interfaces, then the data model
  and where state lives, then the components, then the failure modes, then what to measure, then
  the trade-off the user would revisit first. Signposting each step is a large part of what is
  being scored.
- **The questions to ask before drawing anything.** A candidate who starts drawing before asking
  what the read-to-write ratio is has already lost points. Write four or five.
- **The numbers the user genuinely owns.** Real scale from atoms beats invented back-of-envelope
  figures: fleet sizes, request rates, latencies, cluster counts, incident volumes, cost figures.
  Anchoring a design in numbers actually operated is the strongest single move available, and it
  is only available to someone who has them ready.
- **The trade-offs to name explicitly**, in this domain: consistency against availability, cost
  against latency, build against buy, the thing that breaks first at ten times the load.
- **Where to be honest.** If the design touches a `match.md` gap, the boundary is stated once,
  plainly, and then the user reasons from first principles anyway. Reasoning well in an unfamiliar
  area scores better than pretending familiarity and being caught.

### Deep technical

This section is aimed at the resume. For each of the three or four strongest technical claims the
user has made across rounds 1 and 2, write:

- The claim, and the atoms behind it.
- **The probe a specialist would use.** Not "tell me about Kubernetes" but the question that
  separates someone who ran it from someone who read about it: what broke, what the actual
  configuration was, why that choice over the alternative, what it cost.
- The honest answer, including the parts that are hazy. **"I do not remember the number" is a
  fine answer; a wrong number is not**, and an invented one is fatal because it is checkable.

Then the mirror image: for each gap in `match.md` likely to come up, the boundary sentence and
the adjacent evidence. Round 3 is where a claim that was waved through in round 1 gets examined,
so anything that was softened earlier gets its accurate version written here.

### Behavioral and team fit

Scored against how this team works. The material comes from `analysis.md`'s inferred priorities
and from what the manager said in round 2, not from generic values.

- **Four or five prepared stories**, each with a different shape, drawn from atoms: a conflict, a
  failure that was owned, a decision made without enough information, a time the user changed
  their mind, a time they raised something unpopular. One per theme; reusing a single story for
  everything is transparent.
- **The failure story is the one to get right.** A real failure, a real cost, and a specific
  change that followed. Anything that resolves into a hidden strength is heard as evasion.
- **The reverse questions.** Fit is two-way, and asking about it well is itself a fit signal. How
  disagreement gets handled, what happens when something ships broken, what the team does badly,
  what the last hard decision was and how it was made.
- **What the user actually needs from a team**, said plainly. A candidate who knows what they need
  is easier to place than one who agrees with everything.

### Closing

- The one thing to make sure they know before the round ends, if it has not come up.
- Any objection still standing after two rounds, and whether to raise it here or leave it.
- What to ask about next steps, timeline and decision process, explicitly.

## What to collect

Even at the last round, capture it. Offers get negotiated, processes add rounds, and a rejection
here is the most useful data in the whole pipeline:

- Which section went badly, section by section, while it is still recoverable in a follow-up.
- Anything asked that the profile has no atom for. That is a hole in the master profile, not just
  a bad moment.
- The timeline and decision process they stated.
- Anything learned about the team that changes whether the user wants the job.
