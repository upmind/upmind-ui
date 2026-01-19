---
description: Systematically debug an issue encountered during development
---

# Debug Issue Workflow

Use this workflow when you encounter an error or unexpected behavior.

## Steps

### 1. Capture the Error

Ask the user:

```
Please share:
1. Exact error message (copy/paste)
2. Command or action that triggered it
3. What were you trying to do?
```

### 2. Categorize the Error

| Type | Examples |
|------|----------|
| **Build** | TypeScript, Vite, esbuild |
| **Runtime** | Console errors, exceptions |
| **Test** | Vitest, Playwright failures |
| **Type** | TypeScript mismatches |
| **Lint** | ESLint, Prettier |
| **Dependency** | Missing packages, versions |

### 3. Gather Context

// turbo
Based on error type, gather relevant files:

```bash
# Find config files
find . -name "tsconfig*.json" -o -name "vite.config.*" -o -name "package.json" | head -10

# Find test files
find . -name "*.test.*" -o -name "*.spec.*" | head -10
```

### 4. Analyze

1. Read the error carefully
2. Check the stack trace origin
3. Identify root cause (not symptom)
4. Consider recent changes

### 5. Propose Fix

```
## Diagnosis

**Root Cause:** [Explanation]

**Affected Files:**
- [file1]
- [file2]

**Proposed Fix:**
[Description]

**Risk Level:** [Low/Medium/High]

Shall I proceed?
```

### 6. Implement & Verify

Make the fix and verify:

// turbo

```bash
npm run build
npm run test
```

### 7. Document (If Significant)

Add to TASK.md learnings:

```markdown
## Learnings

### [Date] - [Bug Title]
**Symptom:** [What was observed]
**Root Cause:** [What was wrong]
**Fix:** [What we did]
**Prevention:** [How to avoid]
```

## Quick Debug

```
I got this error: [paste error]
Help me fix it.
```

## Common Patterns

### TypeScript

- Check `tsconfig.json` paths
- Verify imports
- Look for missing types

### Build

- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `npm install`
- Check Vite config

### Tests

- Check test setup
- Verify mocks
- Async timing issues

### Dependencies

- Check version matches
- Peer dependency warnings
- Try `npm install --force`
