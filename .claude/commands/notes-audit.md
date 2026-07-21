---
name: notes-audit
description: Audit client-facing notes, drafts, or published docs against writing standards and internal coherence, with sympathetic copywriter feedback
---

# Notes / Docs Audit Workflow

Audit non-technical, client-facing documentation (product notes, Notion drafts, gdocs, marketing copy, help-centre articles) for internal coherence, completeness, structure, clarity, and actionability. Produces a structured audit with a delta against any prior audit, evidence-based findings, and a confidence score.

This is the non-code-specific sibling of `/docs-audit`. Use it when the source of truth is the author's own intent and the reader's job-to-be-done — not the codebase.

## When to Use

- A product owner / copywriter has drafted notes or docs and wants a review
- Re-auditing after a revision to confirm fixes landed and flag regressions
- Pre-publish QA on client-facing content
- Coherence check on a long-form draft (FAQs, onboarding guides, release notes, internal briefs)

**Not for:** auditing docs that need codebase cross-referencing (use `/docs-audit`).

## Prerequisites

- Notion MCP authenticated if source is Notion — run `/mcp` and connect
- Read access to the source (gdoc share link, local file path)
- Write access to `docs/audit/` (create it if missing)

## Inputs

Ask the user for these before starting:

1. **Source** — Notion URL/page ID, Google Doc URL, or local markdown path
2. **Author** — who wrote it (used in feedback framing — sympathetic by default)
3. **Audience** — who reads it (end customer? internal stakeholder? prospect?) — this anchors clarity and actionability scoring
4. **Job-to-be-done** — what should the reader be able to do after reading
5. **Scope** — full holistic audit, delta-only vs prior, or both (default: both)
6. **Prior audit path** — if delta-only or combined, the path to the previous audit
7. **Writing standard (optional)** — link to any style guide / tone-of-voice doc to grade against. If absent, fall back to the generic standard in step 4 below.

## Steps

### 1. Fetch the source

**Notion:** use `mcp__claude_ai_Notion__notion-fetch` on the root page, then fetch every child page recursively — do not skip leaf pages.

**Google Docs:** if a gdoc MCP is available, fetch directly. Otherwise, ask the user to export to markdown or paste content into a local file and re-run.

**Local files:** read the markdown directly. If a folder is given, walk it.

**Critical:** capture verbatim content. Any empty sections, unresolved comment threads, placeholder text (`[TBD]`, `xxx`, `TODO`), or contradictions are evidence of in-progress work and must be preserved for the audit.

### 2. Build an internal map

Before grading, list out:

- Every page / section heading
- Every claim of fact (numbers, dates, names, commitments)
- Every cross-reference (internal links, "see section X", "as mentioned above")
- Every call-to-action

This map is what you'll grade. Save it as you go — it becomes Appendix D.

### 3. Check internal coherence

Without external truth to cross-reference, coherence is the strongest signal:

- Do claims contradict each other across pages?
- Do cross-references resolve (does "section 4" actually exist)?
- Do numbers add up where they should (percentages summing to 100, totals matching parts)?
- Is terminology used consistently (same noun for the same thing throughout)?
- Are the same questions answered the same way in different places?
- Do examples match the rules they illustrate?

Flag every contradiction with verbatim quotes from both sides.

### 4. Grade against a writing standard

If the user provided a style guide, grade against it. Otherwise use this generic standard:

**Structure:**
- [ ] Title states the value or job, not the topic
- [ ] Opening sets context: who it's for, what they'll get, how long it takes
- [ ] Headings are scannable and parallel in form
- [ ] One idea per paragraph; one job per section
- [ ] Lists used where the content is genuinely a list (not as filler)
- [ ] Concrete examples in every section that introduces a concept

**Clarity:**
- [ ] Sentences average under 25 words
- [ ] Jargon is either defined on first use or removed
- [ ] Active voice unless passive is deliberate
- [ ] No undefined acronyms
- [ ] Pronouns have unambiguous antecedents

**Actionability:**
- [ ] The reader knows what to do next at every section break
- [ ] Steps are numbered when order matters
- [ ] Prerequisites are stated before they're needed
- [ ] CTAs are specific ("Book a 20-min call" beats "Get in touch")

**Tone (against the provided guide, or generic):**
- [ ] Consistent voice across the document
- [ ] Audience-appropriate register (no corporate-speak to end users; no folksy hand-waving to enterprise prospects)
- [ ] No empty intensifiers ("very", "really", "leverage", "robust") unless earning their place

### 5. Delta (if prior audit provided)

For every issue flagged in the prior audit, mark status and cite evidence:

- ✅ **FIXED** — no longer present
- 🟡 **PARTIAL** — partially addressed; specify what's missing
- ❌ **NOT FIXED** — unchanged since prior audit
- 🔁 **REGRESSED** — was fixed, now broken again

Then add:

- **New issues** introduced since the prior audit (🔴 critical / 🟠 warning / 🟡 suggestion)
- **New strengths** — call out the author's wins explicitly

### 6. Categorise in-progress vs not-started

Split remaining issues into three buckets — this drives prioritisation:

- 🟠 **In progress** — evidence of mid-edit work (unresolved comment threads, `<span discussion-urls=...>` markers, placeholder text, intra-page contradictions, stray draft syntax)
- 🔴 **Not started** — no evidence of any work on this area
- ✅ **Done** — shippable without further edits

### 7. Score the audit

Five categories, each 0-100:

| Category | What it measures |
| --- | --- |
| Coherence | Does the doc agree with itself? |
| Completeness | Are all sections the audience needs present? |
| Structure | Does it follow the writing standard? |
| Clarity | Is it readable and unambiguous for the stated audience? |
| Actionability | Can the reader accomplish the stated job? |

Overall = simple average. Show delta vs prior audit in a table.

### 8. Write the author feedback section

Tone rules:

- Open with genuine acknowledgement of what improved or worked well
- Concrete, not vague — cite exact pages/sections and quote offending text
- Prioritise top 3 fixes; order by severity × ease
- Distinguish "needs a rewrite" from "needs a clarifying decision" — the second one isn't a writing problem, it's an open question for the author to resolve
- End with a one-sentence summary the author can act on

### 9. Save the audit

Location: `docs/audit/{source-slug}-{YYYY-MM-DD}.md`

Examples:

- `docs/audit/onboarding-notes-2026-05-27.md`
- `docs/audit/pricing-page-draft-review-2026-05-27.md`

Create the folder if missing:

```bash
mkdir -p docs/audit
```

### 10. Report back

Summarise to the user in under 400 words:

- Where the file was written
- New confidence score vs prior
- Top 3 FIXED
- Top 3 STILL BROKEN or NEWLY BROKEN
- One-line verdict on whether the author made meaningful progress

## Document Structure

Every audit file must contain these sections in order:

1. **Header** — date, auditor, previous audit link, source, author, audience, job-to-be-done
2. **Executive summary** — scoring table with delta, one-paragraph verdict
3. **Part 1: Delta audit** — tables of prior issues with status markers, new issues, new strengths
4. **Part 2: Fresh full audit** — scoring rubric, category breakdown (coherence / completeness / structure / clarity / actionability)
5. **Author feedback** — sympathetic, prioritised, concrete
6. **Appendix A: Open questions for the author** — decisions the audit can't resolve (not writing problems)
7. **Appendix B: Internal contradictions** — verbatim quotes of conflicting claims
8. **Appendix C: Verbatim evidence** — exact quotes for critical issues
9. **Appendix D: Internal map** — pages, headings, claims, cross-references catalogued in step 2
10. **Appendix E: In-progress signals** — three-bucket categorisation
11. **Appendix F: Placement recommendations** — where content should live (only if author asked)

Section 11 is optional; everything above is mandatory.

## Checklist

Before reporting back, verify:

- [ ] Every leaf page / section in the source was fetched
- [ ] Every contradiction cites verbatim quotes from both sides
- [ ] Cross-references were resolved (or flagged as broken)
- [ ] Status markers used consistently (✅ / 🟡 / ❌ / 🔁)
- [ ] Scoring rubric shows delta vs prior audit
- [ ] Author feedback opens with acknowledgement, not criticism
- [ ] Open questions separated from writing problems
- [ ] In-progress signals separated from not-started items
- [ ] File saved to `docs/audit/` with date-stamped name

## Quick Start

Full audit of a Notion page:

```
/notes-audit https://www.notion.so/workspace/page-id
```

Delta-only against a prior audit:

```
/notes-audit https://www.notion.so/workspace/page-id --delta-vs docs/audit/previous-2026-05-10.md
```

Google Doc (export to markdown first if no gdoc MCP):

```
/notes-audit ./drafts/onboarding-notes.md
```

## Tips

- **Fetch everything** — skipping sub-pages hides contradictions
- **Quote verbatim** — paraphrased issues get disputed; exact text doesn't
- **Separate "needs a rewrite" from "needs a decision"** — the second is the author's job, not a copy fix
- **Anchor scoring to the stated audience** — clarity for an end customer ≠ clarity for an enterprise prospect
- **Preserve prior audits** — never overwrite; use date-stamped filenames
- **Lead with acknowledgement** — product owners write under pressure; the feedback lands better when the wins are named first
