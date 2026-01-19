---
description: Perform a comprehensive deep analysis of a codebase, layer, or project to understand architecture, dependencies, patterns, and identify improvements
---

# Deep Codebase Analysis Workflow

This workflow performs a thorough technical analysis of a codebase to understand its architecture, evaluate code quality, identify patterns/anti-patterns, and provide actionable recommendations.

## Prerequisites

Before starting, gather from the user:

- **Target Path**: The directory/layer to analyze (e.g., `layers/matterific`)
- **Focus Areas** (optional): Specific concerns (performance, security, maintainability, etc.)
- **Output Location**: Where to save the analysis (default: artifacts directory)

---

## Phase 1: Initial Exploration

### 1.1 Understand Project Structure

// turbo

```
List the root directory to understand the overall structure
```

### 1.2 Analyze Package Configuration

Read and analyze:

- `package.json` - dependencies, scripts, metadata
- Config files (`nuxt.config.ts`, `vite.config.js`, `tsconfig.json`, etc.)
- Environment files (`.env.example`, etc.)

### 1.3 Read Documentation

Review existing documentation:

- `README.md`
- Any docs in `/docs` folder
- Inline documentation patterns

---

## Phase 2: Dependency Audit

### 2.1 Categorize Dependencies

Group dependencies by purpose:

- **Framework** (Vue, Nuxt, React, etc.)
- **State Management** (Pinia, Redux, XState, etc.)
- **UI Components** (Vuetify, Tailwind, etc.)
- **Backend/API** (Firebase, Axios, etc.)
- **Utilities** (Lodash, date-fns, etc.)
- **Dev Tools** (ESLint, TypeScript, etc.)

### 2.2 Version Assessment

For each critical dependency, check:

- Is it pinned properly? (no `latest`)
- Is it up to date?
- Are there any duplicates?
- Are there deprecated packages?

### 2.3 Identify Red Flags

Look for:

- Duplicate packages with different versions
- Package managers as dependencies
- Very outdated critical packages
- Unnecessary heavy dependencies

---

## Phase 3: Architecture Analysis

### 3.1 Directory Structure Mapping

Document the folder structure and purpose of each directory:

- `/components` - Reusable UI components
- `/composables` - Vue composition functions
- `/store` - State management
- `/services` - Business logic
- `/utils` - Utility functions
- etc.

### 3.2 Module/Feature Analysis

For each major module or feature area:

1. Read the entry point (`index.ts` or `index.js`)
2. Understand the public API
3. Identify dependencies on other modules
4. Document key responsibilities

### 3.3 Data Flow Mapping

Trace how data flows through the application:

- External sources → API/Services
- Services → Stores
- Stores → Components
- User actions → State changes

---

## Phase 4: Core Patterns Deep Dive

### 4.1 Examine Core Data Structures

Identify and document central data structures:

- Main entity/model definitions
- Configuration objects
- State shapes
- API response types

### 4.2 Service Layer Review

Analyze the service/business logic layer:

- How are services organized?
- What patterns are used (factory, singleton, etc.)?
- How is error handling done?
- How is async logic managed?

### 4.3 State Management Review

Examine state management approach:

- Store structure and organization
- Action/mutation patterns
- State machine usage (if applicable)
- Cross-store communication

### 4.4 Component Patterns

Review component architecture:

- Component composition patterns
- Props/emit conventions
- Slot usage
- Provide/inject patterns

---

## Phase 5: Code Quality Assessment

### 5.1 TypeScript Usage

Assess TypeScript adoption:

- What percentage of files are TypeScript?
- Are there proper types/interfaces defined?
- Is `any` overused?
- Are generics used appropriately?

### 5.2 Identify Good Patterns

Document positive patterns found:

- Clean abstractions
- Proper separation of concerns
- Consistent coding style
- Effective use of framework features

### 5.3 Identify Anti-patterns

Look for problematic patterns:

- Code duplication
- Tight coupling
- Magic strings/numbers
- Inconsistent error handling
- Memory leak risks
- Circular dependencies
- Private API usage

### 5.4 Test Coverage Review

Assess testing infrastructure:

- Are there test files?
- What testing frameworks are used?
- What is the approximate coverage?
- Are critical paths tested?

---

## Phase 6: Security Assessment

### 6.1 Authentication & Authorization

Review security implementation:

- How is authentication handled?
- Are routes/pages properly protected?
- Is there role-based access control (RBAC)?
- Are permissions checked server-side or only client-side?

### 6.2 Data Security

Check for data protection measures:

- Is sensitive data encrypted at rest?
- Are API keys/secrets properly managed (environment variables)?
- Is user input sanitized before storage?
- Are there any exposed credentials in the codebase?

### 6.3 Common Vulnerabilities

Look for security anti-patterns:

- **XSS**: Is user content properly escaped/sanitized?
- **CSRF**: Are forms protected with tokens?
- **Injection**: Is dynamic query construction safe?
- **Insecure Dependencies**: Check for known vulnerabilities (`npm audit`)

### 6.4 Firebase/Backend Security

If Firebase is used:

- Are Firestore rules properly configured?
- Are storage rules restricting access?
- Is App Check enabled?
- Are Cloud Functions secured?

---

## Phase 7: Performance Analysis

### 7.1 Bundle Size Analysis

Assess the build output:

- What is the total bundle size?
- Are there any excessively large dependencies?
- Is code splitting implemented?
- Are dynamic imports used for heavy components?

### 7.2 Runtime Performance

Look for performance patterns:

- Unnecessary re-renders (Vue reactivity misuse)
- Memory leaks (event listeners, subscriptions not cleaned up)
- Expensive computations in render cycle
- Large list rendering without virtualization

### 7.3 Data Fetching Efficiency

Review data loading strategies:

- Is caching implemented?
- Are requests deduplicated?
- Is there pagination for large datasets?
- Are N+1 query patterns avoided?

### 7.4 Asset Optimization

Check static asset handling:

- Are images optimized/lazy-loaded?
- Are fonts subset or using system fonts?
- Is CSS purging enabled for utility frameworks?

---

## Phase 8: Developer Experience (DX) Analysis

### 8.1 Onboarding Difficulty

Estimate learning curve:

- How long would it take a new developer to be productive?
- Are there documentation or READMEs for key modules?
- Is the architecture self-explanatory or requires tribal knowledge?

### 8.2 Development Workflow

Assess day-to-day DX:

- Is hot reload working smoothly?
- Are there clear error messages?
- Is debugging easy (sourcemaps, dev tools)?
- Are git hooks configured (lint-staged, husky)?

### 8.3 Code Discoverability

How easy is it to find things:

- Are file/folder names intuitive?
- Is there consistent naming convention?
- Are related files co-located?
- Is there a clear public API for each module?

### 8.4 IDE Support

TypeScript and tooling integration:

- Does the IDE provide good autocomplete?
- Are types available for key interfaces?
- Are there any `@ts-ignore` or `any` overuse?

---

## Phase 9: Error Handling & Logging

### 9.1 Error Handling Patterns

Assess how errors are managed:

- Is there a centralized error handling strategy?
- Are errors properly typed/classified?
- Do errors bubble up appropriately or get swallowed?
- Are user-facing errors meaningful vs cryptic?

### 9.2 Logging Infrastructure

Review logging practices:

- Is there structured logging (vs console.log everywhere)?
- Are log levels used appropriately (debug, info, warn, error)?
- Is sensitive data being logged accidentally?
- Is there a logging service integration (Sentry, LogRocket, etc.)?

### 9.3 Error Boundaries

For frontend applications:

- Are there error boundaries to prevent full app crashes?
- Do components fail gracefully?
- Are loading/error/empty states handled consistently?

---

## Phase 10: Documentation Quality

### 10.1 README Assessment

Evaluate documentation completeness:

- Is there a root README with project overview?
- Are setup instructions clear and accurate?
- Are environment variables documented?
- Is the architecture explained?

### 10.2 Inline Documentation

Review code-level documentation:

- Are complex functions/classes documented?
- Are "why" comments present (not just "what")?
- Are there outdated/misleading comments?
- Is JSDoc/TSDoc used consistently?

### 10.3 Module Documentation

For each major module:

- Is there a README explaining purpose and usage?
- Are public APIs documented?
- Are there usage examples?

### 10.4 Decision Records

Check for architectural documentation:

- Are there ADRs (Architecture Decision Records)?
- Are significant decisions documented with rationale?
- Is there a changelog maintained?

---

## Phase 11: API & Interface Design

### 11.1 Internal Module APIs

Review how modules expose functionality:

- Are public/private boundaries clear?
- Are function signatures consistent?
- Is the API surface minimal (not over-exposed)?
- Are breaking changes easy to identify?

### 11.2 External API Patterns (if applicable)

For apps with APIs:

- Is there consistent error response format?
- Are endpoints RESTful or following chosen convention?
- Is versioning considered?
- Are request/response types defined?

### 11.3 Event/Message Patterns

For event-driven architectures:

- Are event names consistent and discoverable?
- Is the event payload structure documented?
- Are there type definitions for events?

---

## Phase 12: Generate Analysis Document

### 12.1 Document Structure

Create the analysis document with these sections:

1. **Executive Summary**
   - Overall assessment
   - Key findings table

2. **Architecture Overview**
   - Visual diagram (Mermaid)
   - Directory structure explanation

3. **Technology Stack & Dependencies**
   - Dependency table with versions and assessments
   - Identified issues

4. **Core Modules Analysis**
   - Module breakdown
   - Module patterns

5. **Data Structures & Patterns**
   - Central data structures
   - Key patterns used

6. **Coding Patterns**
   - Good patterns (with examples)
   - Concerning patterns (with examples)

7. **Anti-patterns & Technical Debt**
   - Critical issues
   - Moderate issues
   - Minor issues

8. **Security Assessment**
   - Authentication & authorization review
   - Data security practices
   - Vulnerability considerations

9. **Performance Analysis**
   - Bundle size analysis
   - Runtime performance concerns
   - Data fetching efficiency

10. **Developer Experience**
    - Onboarding difficulty estimate
    - Development workflow assessment
    - Code discoverability

11. **Error Handling & Logging**
    - Error handling patterns
    - Logging infrastructure
    - Error boundaries

12. **Documentation Quality**
    - README assessment
    - Inline documentation
    - Module documentation

13. **API & Interface Design**
    - Internal module APIs
    - Event/message patterns

14. **Strengths**
    - What the codebase does well

15. **Areas for Improvement**
    - Prioritized improvement areas

16. **Recommendations**
    - Immediate actions
    - Short-term (1-3 months)
    - Medium-term (3-6 months)
    - Long-term (6-12 months)

### 12.2 Save Analysis

Save the analysis document to the layer's docs folder:

```text
/layers/[layer-name]/docs/ANALYSIS.md
```

This keeps the analysis with the code it describes, which is important for:

- Sub-repos that may be used independently
- Version control alongside the code
- Discoverability by developers working on the layer

---

## Phase 13: Present Findings

### 13.1 Summarize Key Takeaways

Provide a concise summary to the user highlighting:

- Top 3 strengths
- Top 3 concerns
- Most urgent action items

### 13.2 Offer Next Steps

Suggest follow-up options:

- Analyze another layer/section
- Create implementation plan for recommendations
- Deep dive into specific concern areas

---

## Customization Notes

### For Different Project Types

**Frontend SPA (Vue/React)**

- Focus on component patterns, state management, bundle size

**Nuxt/Next.js**

- Include SSR considerations, middleware, API routes

**Library/Package**

- Focus on public API design, bundle size, tree-shaking

**Monorepo**

- Analyze cross-package dependencies, shared utilities

### Time Estimates

| Codebase Size | Estimated Duration |
|---------------|-------------------|
| Small (<50 files) | 10-15 minutes |
| Medium (50-200 files) | 20-30 minutes |
| Large (200-500 files) | 30-45 minutes |
| Very Large (500+ files) | 45-60 minutes |

---

## Example Invocation

```
/deep-analysis

Target: layers/matterific
Focus: Architecture, TypeScript adoption, maintainability
Output: artifacts/matterific-analysis.md
```
