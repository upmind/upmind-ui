---
description: Fix TSConfig configuration for dev and build workflows
---

# Fix TSConfig Configuration

## Context

The monorepo needs two working TypeScript configurations:

1. **Development (IDE)**: `tsconfig.json` - Type-checking from source files WITHOUT requiring a build
2. **Production (Build)**: `tsconfig.build.json` - Used by vite build with project references

## Requirements

1. **Dev workflow MUST work without builds**: Files importing `@upmind-automation/*` packages should resolve types from source
2. **Build workflow MUST work**: `pnpm build` should complete successfully
3. **Standalone packages**: `types`, `icons`, `ui` are external submodules - NO references to other monorepo packages
4. **No build artifacts in src/**: No .d.ts, .js, .js.map files should be generated in src directories

## Package Dependencies

```
types (standalone)
icons (standalone)
ui (standalone - external submodule)
i18n → types
headless → types, i18n
client-vue → types, i18n, headless, icons, ui
apps → all packages
```

## Error Handling & Recovery

> [!IMPORTANT]
> This workflow may involve long-running builds. Use these patterns to avoid timeout/retry issues:

### For Long Commands

// turbo-all

1. Use `WaitMsBeforeAsync` of 300000 (5 min) for `pnpm build`
2. Always check command status with `command_status` tool after background commands
3. If a command times out, check status again - don't assume failure

### On Build Failure - Iterative Fix Pattern

1. Capture the FULL error output (first 50-100 lines)
2. Identify the FIRST failing package in the chain
3. Fix that package only
4. Rebuild just that package: `cd packages/<name> && pnpm build`
5. Only proceed to full build after the single package succeeds

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `TS6306: Referenced project must have composite: true` | Reference points to wrong tsconfig | Update reference to point to `tsconfig.build.json` |
| `TS2742: inferred type cannot be named without reference` | Type extends external dependency types | Make types self-contained (see radix-vue fix below) |
| `Cannot find module @upmind-automation/*` | Missing paths or includes in tsconfig.json | Add paths to source files |

## Verification Steps

// turbo-all

1. Clean and install:

   ```bash
   pnpm clean
   ```

2. Test dev workflow (no dist folders should exist):

   ```bash
   rm -rf packages/*/dist 2>/dev/null; cd packages/headless && pnpm tsc -p tsconfig.json 2>&1 | grep "@upmind-automation" || echo "No errors"
   ```

3. Test build workflow:

   ```bash
   pnpm build
   ```

4. Verify no artifacts in src:

   ```bash
   find packages apps -name "*.d.ts" -path "*/src/*" 2>/dev/null | wc -l
   find packages apps -name "*.js" -path "*/src/*" 2>/dev/null | wc -l
   ```

## Key TSConfig Patterns

### Dev Config (tsconfig.json)

- `noEmit: true` - Don't emit, just type-check
- `paths` pointing to source files: `"@upmind-automation/types": ["../types/src/index.ts"]`
- `include` must have package source dirs: `["src/**/*", "../types/src/**/*", ...]`

### Build Config (tsconfig.build.json)

- `composite: true` for project references
- `include: ["src"]` - Only local source
- `references` to dependency **tsconfig.build.json** files (NOT the default tsconfig.json)
- NO paths to other package sources

## Known Fixes Applied

### radix-vue Type Portability Fix

**File**: `packages/ui/src/ui/select-cards/types.ts`

**Problem**: `SelectCardsItemProps` and `SelectCardsProps` extended radix-vue types (`RadioGroupItemProps`, `RadioGroupRootProps`), causing vue-tsc to fail in consuming packages with error:

```
The inferred type cannot be named without a reference to 'radix-vue/dist/index'
```

**Solution**: Make types self-contained by inlining base props instead of extending radix-vue types:

```typescript
// Instead of:
export interface SelectCardsItemProps extends RadioGroupItemProps { ... }

// Use:
interface PrimitiveBaseProps {
  as?: string | Component;
  asChild?: boolean;
}
export interface SelectCardsItemProps extends PrimitiveBaseProps {
  value?: string;
  disabled?: boolean;
  id?: string;
  // ... rest of props
}
```

### apps/cart tsconfig.build.json References

**Problem**: References pointed to package directories instead of build configs:

```json
{ "path": "../../packages/types" }  // WRONG
```

**Solution**: Point to specific build config files:

```json
{ "path": "../../packages/types/tsconfig.build.json" }  // CORRECT
```
