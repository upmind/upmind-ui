---
description: Generate an implementation plan and user stories from a codebase analysis, with output formatted for the team's project management platform
---

# Implementation Planning Workflow

This workflow takes an existing codebase analysis and helps developers plan improvements by generating an implementation plan and user stories that can be imported into their project management tool.

## Prerequisites

Before starting, ensure:

- A `/deep-analysis` has been run and ANALYSIS.md exists for the target layer
- The developer is available to answer questions about priorities and preferences

---

## Phase 1: Gather Context

### 1.1 Read Existing Analysis

// turbo

```bash
# Locate and read the ANALYSIS.md file for the target layer
```

Review the analysis document, specifically noting:

- Areas for Improvement section
- Recommendations (Immediate, Short-term, Medium-term, Long-term)
- Anti-patterns & Technical Debt
- Any security, performance, or DX concerns

### 1.2 Summarize Findings

Create a brief summary of the key improvement areas found in the analysis:

- Group by category (Code Quality, Performance, Security, DX, Documentation)
- Note estimated effort levels
- Identify quick wins vs major initiatives

---

## Phase 2: Developer Interview

### 2.1 Project Management Platform

Ask the developer:

> **Which project management platform does your team use?**
>
> | Option | Platform |
> |--------|----------|
> | A | Trello |
> | B | Monday.com |
> | C | Linear |
> | D | Jira |
> | E | GitHub Issues/Projects |
> | F | Notion |
> | G | Asana |
> | H | Shortcut (Clubhouse) |
> | I | ClickUp |
> | J | Other (specify) |
> | K | None (markdown only) |

Record the platform choice for output formatting.

### 2.2 User Story Format Preference

Ask the developer:

> **What user story format does your team prefer?**
>
> | Option | Format | Example |
> |--------|--------|---------|
> | A | **Classic** | "As a [role], I want [feature], so that [benefit]" |
> | B | **Job Story** | "When [situation], I want [motivation], so I can [outcome]" |
> | C | **Simple** | Title + Description + Acceptance Criteria |
> | D | **Technical** | Title + Description + Technical Notes + Test Cases |

Default to **Classic** if no preference.

### 2.3 Field Customization

Based on the platform, present the default fields:

#### Platform-Specific Defaults

**Trello/Notion/Markdown:**

- Title
- Description
- Checklist (Acceptance Criteria)
- Labels (Priority, Type)

**Monday.com:**

- Name
- Description
- Status (To Do)
- Priority (Critical/High/Medium/Low)
- Timeline (empty)
- Owner (empty)

**Linear:**

- Title
- Description
- Priority (Urgent/High/Medium/Low/None)
- Estimate (points: 1/2/3/5/8)
- Labels

**Jira:**

- Summary
- Description
- Issue Type (Story/Task/Bug)
- Priority (Highest/High/Medium/Low/Lowest)
- Story Points
- Labels
- Epic Link

**GitHub Issues:**

- Title
- Body (Description + Acceptance Criteria)
- Labels
- Milestone

**Asana:**

- Name
- Notes
- Due Date (empty)
- Tags
- Section

Ask:
> These are the default fields for [Platform]. Would you like to:
>
> - A) Use defaults
> - B) Add fields (specify)
> - C) Remove fields (specify)

### 2.4 Additional Improvement Areas

Present the findings from the analysis and ask:

> **Based on the analysis, these improvement areas were identified:**
>
> [List improvement areas from analysis]
>
> **Questions:**
>
> 1. Are there any areas you want to **prioritize** or **deprioritize**?
> 2. Are there any **additional improvements** not covered that you'd like to include?
> 3. What is your **target timeframe**? (e.g., next sprint, next quarter, next 6 months)
> 4. Are there any **constraints** we should consider? (e.g., no breaking changes, must maintain backwards compatibility)

### 2.5 Story Grouping Preference

Ask:

> **How should stories be organized?**
>
> | Option | Organization |
> |--------|--------------|
> | A | **By Category** (Code Quality, Performance, Security, etc.) |
> | B | **By Priority** (Critical → Low) |
> | C | **By Timeline** (Immediate, Short-term, Medium-term, Long-term) |
> | D | **By Epic/Initiative** (Group related stories under parent) |

---

## Phase 3: Generate Implementation Plan

### 3.1 Create Implementation Plan Document

Based on the analysis and developer input, create:

```
/[layer]/docs/IMPLEMENTATION_PLAN.md
```

**Document Structure:**

```markdown
# Implementation Plan: [Layer Name]

> Generated from analysis on [date], with input from [developer if known]

## Overview

Brief summary of what this plan addresses and the expected outcomes.

## Scope & Constraints

- Target timeframe: [from interview]
- Constraints: [from interview]
- Out of scope: [if any]

---

## Initiatives

### Initiative 1: [Name]

**Goal:** [What we're trying to achieve]

**Stories:**
| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 1.1 | ... | High | M |
| 1.2 | ... | Medium | S |

**Dependencies:** [Any prerequisites]

**Success Criteria:** [How we know it's done]

---

### Initiative 2: [Name]
...

---

## Timeline

| Phase | Timeline | Initiatives |
|-------|----------|-------------|
| Immediate | This sprint | 1, 2 |
| Short-term | 1-3 months | 3, 4 |
| Medium-term | 3-6 months | 5 |
| Long-term | 6-12 months | 6 |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ... | ... | ... |

## Next Steps

1. Review and approve this plan
2. Import stories to [Platform]
3. Begin with Initiative 1
```

---

## Phase 4: Generate User Stories

### 4.1 Determine Output Format

Based on story count and platform:

| Story Count | Platform | Output Format |
|-------------|----------|---------------|
| ≤ 10 | Any | Individual Markdown files |
| > 10 | Trello | JSON (for Trello import) |
| > 10 | Monday | CSV |
| > 10 | Linear | CSV |
| > 10 | Jira | CSV (Jira format) |
| > 10 | GitHub | YAML or CSV |
| > 10 | Notion | CSV |
| > 10 | Asana | CSV |
| > 10 | None/Other | Markdown with table |

### 4.2 Story Generation Guidelines

For each improvement area, generate stories following these principles:

1. **One Outcome Per Story** - Each story should deliver a single, testable outcome
2. **INVEST Criteria** - Independent, Negotiable, Valuable, Estimable, Small, Testable
3. **Clear Acceptance Criteria** - At least 2-3 criteria per story
4. **Linked to Initiative** - Every story belongs to an initiative

**Example Story (Classic Format):**

```markdown
## [ID]: Add TypeScript interfaces for core entities

**As a** developer working on PkgFlow,
**I want** TypeScript interfaces for Package, Transaction, and Entry,
**So that** I get IDE autocomplete and compile-time type checking.

### Acceptance Criteria

- [ ] `Package` interface defined with all schema properties
- [ ] `Transaction` interface defined with workflow mapping
- [ ] `Entry` interface defined with relationship to Transaction
- [ ] Existing JS files can import these types without errors
- [ ] IDE shows correct autocomplete for typed objects

### Technical Notes

- Create in `/types/` directory
- Use `JSONSchema7` type for schema properties
- Consider generating from existing JSON schemas

**Priority:** High
**Estimate:** M
**Initiative:** TypeScript Migration
```

### 4.3 Generate Output Files

**For Markdown (≤10 stories or preference):**

Create individual files:

```
/[layer]/docs/stories/
├── README.md           # Index of all stories
├── 001-typescript-interfaces.md
├── 002-fix-typo-in-status.md
└── ...
```

**For CSV/JSON (>10 stories):**

Create import file:

```
/[layer]/docs/stories/
├── README.md           # Instructions for import
├── stories.csv         # Bulk import file
└── epics.csv           # Epic/Initiative definitions
```

### 4.4 CSV Format Templates

**Jira CSV:**

```csv
Summary,Description,Issue Type,Priority,Story Points,Labels,Epic Link
"Add TypeScript interfaces","As a developer...",Story,High,5,"tech-debt,typescript",INIT-1
```

**Linear CSV:**

```csv
Title,Description,Priority,Estimate,Labels
"Add TypeScript interfaces","As a developer...",High,3,"tech-debt"
```

**GitHub Issues CSV:**

```csv
title,body,labels,milestone
"Add TypeScript interfaces","As a developer...","tech-debt,typescript","TypeScript Migration"
```

**General CSV:**

```csv
ID,Title,Description,Acceptance Criteria,Priority,Estimate,Epic,Labels
1.1,"Add TypeScript interfaces","As a developer...","- Interface defined...",High,M,TypeScript Migration,"tech-debt"
```

---

## Phase 5: Generate Summary & Instructions

### 5.1 Create Stories README

Create `/[layer]/docs/stories/README.md`:

```markdown
# User Stories: [Layer Name]

Generated from implementation plan on [date].

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Stories | X |
| Critical | X |
| High Priority | X |
| Medium Priority | X |
| Low Priority | X |

## Importing to [Platform]

[Platform-specific import instructions]

## Stories by Initiative

### Initiative 1: [Name]
- [ ] Story 1.1: [Title]
- [ ] Story 1.2: [Title]

### Initiative 2: [Name]
...

## Viewing Individual Stories

If using markdown format, each story has its own file in this directory.
```

### 5.2 Platform-Specific Import Instructions

**Trello:**
>
> 1. Open your Trello board
> 2. Go to Menu → More → Print and Export → Import
> 3. Upload `stories.json`

**Monday.com:**
>
> 1. Open your Monday board
> 2. Click ••• → Import → Excel/CSV
> 3. Upload `stories.csv`
> 4. Map columns to fields

**Linear:**
>
> 1. Go to Settings → Import/Export
> 2. Choose "Import issues from CSV"
> 3. Upload `stories.csv`
> 4. Map columns

**Jira:**
>
> 1. Go to System → Import → CSV
> 2. Upload `stories.csv`
> 3. Map fields (Summary, Description, Issue Type, Priority, Story Points, Labels, Epic Link)

**GitHub:**
>
> 1. Use GitHub CLI: `gh issue create --title "..." --body "..." --label "..."`
> 2. Or use a bulk import tool like `github-csv-tools`

---

## Phase 6: Present to Developer

### 6.1 Summary Output

Provide a summary:

> **Implementation Plan Generated!**
>
> **Files Created:**
>
> - `/[layer]/docs/IMPLEMENTATION_PLAN.md` - Overall plan with initiatives and timeline
> - `/[layer]/docs/stories/README.md` - Story index with import instructions
> - `/[layer]/docs/stories/stories.[csv|json|md]` - Stories in [Platform] format
>
> **Quick Stats:**
>
> - X Initiatives
> - Y User Stories
> - Estimated effort: [X weeks/sprints]
>
> **Next Steps:**
>
> 1. Review the implementation plan
> 2. Import stories to [Platform] using the instructions
> 3. Assign owners and refine estimates
> 4. Begin with the first initiative

### 6.2 Offer Follow-up

> Would you like me to:
>
> - Expand any particular initiative with more detail?
> - Adjust story granularity (make stories smaller or combine some)?
> - Add additional technical notes to specific stories?
> - Generate a different export format?

---

## Customization Notes

### Estimation Scales

**T-Shirt Sizing (Default):**

- XS: < 2 hours
- S: 2-4 hours
- M: 1-2 days
- L: 3-5 days
- XL: 1-2 weeks

**Story Points (Fibonacci):**

- 1: Trivial
- 2: Easy
- 3: Medium
- 5: Large
- 8: Very Large
- 13: Should be broken down

### Priority Mapping

| Internal | Jira | Linear | Monday | Trello |
|----------|------|--------|--------|--------|
| Critical | Highest | Urgent | Critical | Red |
| High | High | High | High | Orange |
| Medium | Medium | Medium | Medium | Yellow |
| Low | Low | Low | Low | Green |

---

## Example Invocation

```
/implementation-plan

Target: layers/pkgflow
Based on: ANALYSIS.md
Platform: Linear
Format: Classic user stories
```
