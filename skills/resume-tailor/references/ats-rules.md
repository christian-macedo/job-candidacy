# ATS and first-read constraints

Two readers stand between the resume and a human hiring manager: an applicant tracking
system parsing the PDF into fields, and increasingly a model summarising it. Both fail on
the same things.

## Structure

- **Single column.** Multi-column layouts get read in the wrong order — a sidebar of
  skills interleaves into the job history. The template is single-column for this reason.
- **Real text, never images.** No logos, headshots, icon fonts, or skill-rating bars. A
  graphic "Kubernetes ●●●●○" parses to nothing at all.
- **Standard section headings.** `Summary`, `Experience`, `Skills`, `Education`,
  `Certifications`. Parsers match on these literal words; "Where I've Made an Impact"
  matches nothing.
- **No tables for layout, no text boxes, no headers/footers.** Content in a PDF header
  region is frequently dropped entirely.
- **Dates in one consistent format**, `Mon YYYY – Mon YYYY`, on their own line under the
  job title. Use an en dash and spell the month; `1/21-7/26` is ambiguous to a parser.
- **Title — Organization** on one line, in that order.

## Keywords

- Use the employer's exact term at least once, in a bullet where it is true. "Observability"
  and "monitoring" are the same job to a person and different strings to a matcher.
- Spell out an acronym on first use and keep the acronym: "Azure Kubernetes Service (AKS)".
  Postings vary in which form they use.
- Put keywords inside accomplishment bullets, not only in the skills list. A skill with a
  metric attached reads as experience; a skill in a comma-list reads as a claim.
- **No keyword stuffing** — no white text, no hidden layers, no keyword paragraph at the
  bottom. Modern ATS flag it, and a human sees it immediately in the PDF text layer.

## Punctuation

**No em dashes (—), anywhere.** Recruiters increasingly read them as a tell for AI-generated
text, and a resume that reads as machine-written gets discounted before its content is
weighed. This is a hard rule for every document a recruiter sees: resume, cover letter,
outreach messages.

Rewriting around one is not the same as swapping the character. An em dash usually marks a
sharp aside or a reversal, and the fix depends on which:

| Instead of | Write |
|---|---|
| `Cut costs — about $1.2M — by re-architecting` | `Cut costs, about $1.2M, by re-architecting` |
| `The fix that mattered most — where incidents landed` | `The fix that mattered most was where incidents landed` |
| `Built the platform — six engineers, 72 clusters` | `Built the platform with six engineers across 72 clusters` |
| `Title — Organization` | `Title · Organization` |

Reach for a comma, a colon, a full stop, or a restructured sentence. Two commas where an em
dash pair stood is usually right; a colon works when the second half explains the first. If a
sentence needs an em dash to hold together, it is doing too much and should be two sentences.

**En dashes stay** in numeric ranges (`Jan 2021 – Jul 2026`). That is ordinary typography, it
is what every resume does with dates, and it is not what recruiters are reacting to. Hyphens
in compound words are obviously fine.

## Language

- Start bullets with a verb: led, built, cut, scaled, migrated, designed, negotiated.
- Ban list: "responsible for", "helped with", "worked on", "team player", "results-driven",
  "passionate about", "synergy", "utilize".
- No first-person pronouns. No full sentences ending in periods for the skills lines.
- Quantify with the number that exists. Do not manufacture percentages; "grew from 6 to 72
  clusters" is stronger than an invented "improved efficiency by 30%" anyway.

## File

- **Filename:** `<Firstname>-<Lastname>-<Company>.pdf`. Recruiters save these into a folder
  where the filename is the only distinguishing text.
- **PDF with a selectable text layer**, which is what the renderer produces — verify by
  selecting text in the output.
- Keep it under ~1MB.

## Length

| Experience | Pages |
|---|---|
| < 10 years | 1 |
| 10–20 years | 1–2 |
| 20+ years or heavy leadership scope | 2 |

Three pages is a failure of selection, not a formatting problem. Cut older roles to a
single grouped line before touching type size.
