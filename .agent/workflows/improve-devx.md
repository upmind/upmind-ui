---
description: Improve developer experience and onboarding for any codebase
---

# Improve DevX & Onboarding Workflow

This workflow guides the creation of comprehensive developer experience improvements and onboarding documentation for any codebase, package, or application.

---

## Prerequisites

Gather from the user:

- **Target Path**: The codebase/package to improve (e.g., `./`, `packages/my-pkg`)
- **Tech Stack**: Primary technologies used (e.g., Vue, React, XState)
- **Pain Points** (optional): Known onboarding issues
- **Output Location**: Where to save docs (default: `docs/` in target)

---

## Phase 1: Codebase Assessment

### 1.1 Analyze Complexity Factors

// turbo

```
List and analyze the target directory structure
```

For each factor, rate complexity 1-10:

| Factor | Questions to Ask |
|--------|------------------|
| **State Management** | What pattern? (Redux, XState, Pinia, Zustand) How complex? |
| **Architecture** | Layers? Package boundaries? Data flow patterns? |
| **Type System** | TypeScript strictness? Custom types? |
| **Framework Usage** | Standard patterns or custom abstractions? |
| **Testing** | What frameworks? Coverage expectations? |
| **Build System** | Standard or custom tooling? |
| **Domain Knowledge** | Business logic complexity? |

### 1.2 Calculate Complexity Score

Use this rubric to calculate an overall "Developer Readability Score":

```
Score = Average of:
- State Management (weight: 2x)
- Architecture Patterns (weight: 2x)
- TypeScript/Type System (weight: 1x)
- Framework Patterns (weight: 1x)
- Build/Tooling (weight: 1x)
- Domain Complexity (weight: 1x)

Interpretation:
1-3: Junior-friendly
4-5: Mid-level comfortable
6-7: Mid-Senior required
8-10: Senior/Specialist required
```

### 1.3 Identify Knowledge Gaps

Look for:

- **Unusual Patterns**: Things devs won't have seen before
- **Implicit Conventions**: Unwritten rules
- **Tribal Knowledge**: Things "everyone knows" but aren't documented
- **Dependency-Specific Knowledge**: Libraries requiring learning curve

---

## Phase 2: Audit Existing Documentation

### 2.1 Check Current State

Find and assess existing documentation:

// turbo

```bash
find . -name "README.md" -o -name "*.md" | head -20
```

Create assessment table:

| Document | Status | Quality | Gaps |
|----------|--------|---------|------|
| Root README | ✅/❌ | 1-5 | List missing sections |
| Package READMEs | ✅/❌ | 1-5 | |
| API Docs | ✅/❌ | 1-5 | |
| Architecture Docs | ✅/❌ | 1-5 | |
| Onboarding Guide | ✅/❌ | 1-5 | |

### 2.2 Identify Documentation Priorities

Based on complexity score and gaps, prioritize:

1. **Critical** (blocks productivity): Architecture overview, setup guide
2. **High** (slows down): Pattern documentation, common tasks
3. **Medium** (nice to have): ADRs, advanced guides
4. **Low** (polish): Video walkthroughs, detailed examples

---

## Phase 3: Create Onboarding Guide

### 3.1 Structure Template

Create `docs/ONBOARDING.md` with:

```markdown
# Developer Onboarding Guide

## Overview
[One paragraph: what this codebase does, who uses it]

## Quick Start (Day 1)

### Environment Setup
1. Required tools (Node version, package manager)
2. Clone and install
3. Run locally
4. Verify everything works

### First Tour
- [ ] Run the main application
- [ ] Explore key directories
- [ ] Open key files: [list 3-5 essential files]

## Core Concepts (Days 2-3)

### Architecture Overview
[Diagram or description of how pieces fit together]

### Key Patterns
[List and briefly explain unique patterns]

### Data Flow
[How data moves through the system]

## First Contribution (Days 4-5)

### Suggested First Tasks
- [ ] Fix a typo or small bug
- [ ] Add a small feature with guidance
- [ ] Review and understand existing PR

### Definition of Done
- [ ] Code follows style guide
- [ ] Tests pass
- [ ] PR reviewed

## Resources

- Style Guide: [link]
- Architecture Docs: [link]
- Team Slack/Discord: [link]

## FAQ

### "Nothing happens when I click"
[Common debugging steps]

### "How do I add a new X?"
[Step-by-step]
```

### 3.2 Customize for Tech Stack

Add sections based on technologies:

**For XState projects:**

- XState specific patterns
- How to use inspector
- State machine conventions

**For Monorepos:**

- Package dependency graph
- How changes propagate
- Local linking/development

**For Vue/React:**

- Component patterns
- State management integration
- Composable/Hook conventions

---

## Phase 4: Create Quick Reference Guides

### 4.1 Identify Common Tasks

List 10 most common developer tasks:

1. Add a new feature/page
2. Fix a bug
3. Add a new API endpoint
4. Modify existing component
5. Add a new field to a form
6. Change styling
7. Add a test
8. Debug an issue
9. Deploy changes
10. Review a PR

### 4.2 Create "How To" Cards

For each common task, create a quick reference:

```markdown
# How To: [Task Name]

## TL;DR
[3-5 line summary with exact commands/files]

## Step by Step
1. [Step with code snippet]
2. [Step with code snippet]
3. [Step with code snippet]

## Common Gotchas
- [Thing that trips people up]

## Related
- [Link to detailed docs]
```

Save to `docs/how-to/[task-name].md`

---

## Phase 5: Create Architecture Documentation

### 5.1 High-Level Overview

Create `docs/ARCHITECTURE.md`:

```markdown
# Architecture Overview

## System Diagram

[Mermaid diagram showing major components]

## Package/Module Map

| Package | Purpose | Dependencies |
|---------|---------|--------------|

## Data Flow

[Describe how data moves through the system]

## Key Design Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
```

### 5.2 Create ADRs (Architecture Decision Records)

For each significant design decision, create `docs/adr/NNN-title.md`:

```markdown
# ADR NNN: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[Why this decision was needed]

## Decision
[What was decided]

## Consequences
[Good and bad outcomes]

## Alternatives Considered
[Other options and why rejected]
```

---

## Phase 6: Create Debugging Guide

### 6.1 Common Issues Template

Create `docs/DEBUGGING.md`:

```markdown
# Debugging Guide

## Quick Diagnostic Checklist

- [ ] Check browser console for errors
- [ ] Check terminal for build errors
- [ ] Verify environment variables are set
- [ ] Check network tab for API failures

## Common Issues

### Issue: [Description]
**Symptoms:** [What you see]
**Cause:** [Why it happens]
**Solution:** [How to fix]

### Issue: [Description]
...

## Debugging Tools

- [Tool 1]: How to use
- [Tool 2]: How to use

## Getting Help

- Check existing issues: [link]
- Ask in: [Slack channel]
- Escalate to: [who]
```

---

## Phase 7: Create Onboarding Checklist

### 7.1 Template Checklist

Create `docs/ONBOARDING_CHECKLIST.md`:

```markdown
# Developer Onboarding Checklist

**Developer Name:** _______________
**Start Date:** _______________
**Buddy/Mentor:** _______________

## Week 1: Foundation

### Day 1: Setup
- [ ] Environment configured
- [ ] Codebase cloned and running
- [ ] Access to all required tools
- [ ] Met the team

### Day 2-3: Exploration
- [ ] Read ONBOARDING.md
- [ ] Read style guide
- [ ] Tour of codebase with buddy
- [ ] Run and explore the application

### Day 4-5: First Contribution
- [ ] Made first small PR
- [ ] Received code review
- [ ] Merged first change

## Week 2: Deeper Understanding

- [ ] Understand core architecture
- [ ] Study [key pattern 1]
- [ ] Study [key pattern 2]
- [ ] Complete a small feature independently

## Week 3: Contributing

- [ ] Take on regular tasks
- [ ] Participate in code reviews
- [ ] Document one thing that was confusing
- [ ] Check in with mentor

## Feedback

### What worked well?
_______________

### What was confusing?
_______________

### Suggestions for improvement?
_______________
```

---

## Phase 8: Generate Improvement Roadmap

### 8.1 Prioritize Actions

Create a prioritized list:

| Priority | Action | Effort | Impact | Owner | Status |
|----------|--------|--------|--------|-------|--------|
| P0 | Create ONBOARDING.md | 1d | ⭐⭐⭐⭐⭐ | | |
| P0 | Document key patterns | 2d | ⭐⭐⭐⭐⭐ | | |
| P1 | Quick reference cards | 1d | ⭐⭐⭐⭐ | | |
| P1 | Improve module READMEs | 2d | ⭐⭐⭐⭐ | | |
| P2 | Create debugging guide | 1d | ⭐⭐⭐ | | |
| P2 | Add ADRs | 2d | ⭐⭐⭐ | | |
| P3 | Video walkthroughs | 3d | ⭐⭐ | | |

### 8.2 Save Improvement Plan

Create `docs/DEVX_IMPROVEMENT_PLAN.md` with the roadmap and timeline.

---

## Phase 9: Present Findings

### 9.1 Summary Report

Provide a summary including:

1. **Complexity Score**: Overall and breakdown
2. **Current Documentation State**: What exists, what's missing
3. **Top 3 Onboarding Blockers**: What trips people up
4. **Recommended Priority Actions**: What to do first
5. **Improvement Roadmap**: Timeline with owners

### 9.2 Offer Next Steps

- Create specific documentation
- Review and refine existing docs
- Set up documentation pipeline/automation

---

## Templates Reference

All templates are available at:

- Onboarding Guide: `docs/ONBOARDING.md`
- Architecture: `docs/ARCHITECTURE.md`
- Debugging: `docs/DEBUGGING.md`
- How-To Cards: `docs/how-to/*.md`
- ADRs: `docs/adr/*.md`
- Checklist: `docs/ONBOARDING_CHECKLIST.md`
- Improvement Plan: `docs/DEVX_IMPROVEMENT_PLAN.md`

---

## Notes

- **Iterate on onboarding docs**: Have new devs provide feedback and improve
- **Keep docs close to code**: Documentation in `docs/` or near relevant code
- **Automate where possible**: Generate API docs, keep diagrams up to date
- **Review regularly**: Schedule quarterly documentation reviews
