---
description: Fix TSConfig configuration for dev and build workflows
---

# Fix TSConfig Configuration

## Context

The monorepo needs two working TypeScript configurations:

1. **Development (IDE)**: `tsconfig.json` - Type-checking from source files WITHOUT requiring a build
2. **Production (Build)**: `tsconfig.build.json` - Used by vite build with project references

## Current State

- Original configs were stashed: run `git stash pop` to restore if needed
- Build currently fails at `client-vue` with radix-vue type inference errors (this is a pre-existing code issue, not a config issue)
- There are still some "Outside emitted" warnings from vite-dts

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

## Verification Steps

1. Clean and install:

   ```bash
   pnpm clean
   ```

2. Test dev workflow (no dist folders should exist):

   ```bash
   rm -rf packages/*/dist
   cd packages/headless && pnpm tsc -p tsconfig.json 2>&1 | grep "@upmind-automation"
   # Should have NO "Cannot find module" errors for @upmind-automation packages
   ```

3. Test build workflow:

   ```bash
   pnpm build
   # Should complete successfully with no errors
   ```

4. Verify no artifacts in src:

   ```bash
   find packages apps -name "*.d.ts" -path "*/src/*" | wc -l
   find packages apps -name "*.js" -path "*/src/*" | wc -l
   # Both should return 0
   ```

## Key TSConfig Patterns

### Dev Config (tsconfig.json)

- `noEmit: true` - Don't emit, just type-check
- `paths` pointing to source files: `"@upmind-automation/types": ["../types/src/index.ts"]`
- `include` must have package source dirs: `["src/**/*", "../types/src/**/*", ...]`

### Build Config (tsconfig.build.json)

- `composite: true` for project references
- `include: ["src"]` - Only local source
- `references` to dependency build configs
- NO paths to other package sources

## Fix client-vue radix-vue Error

The error in `TermsConfigSelect.vue` needs a type annotation:

```
src/modules/product/components/terms/TermsConfigSelect.vue(379,5): error TS2742:
The inferred type of '__VLS_17' cannot be named without a reference to
'../../../../../../ui/node_modules/radix-vue/dist/index'
```

This is a code-level issue requiring explicit type annotations in the Vue component.
