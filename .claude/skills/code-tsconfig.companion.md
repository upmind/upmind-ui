> Companion to the upmind-agent skill /code-tsconfig — Upmind-monorepo-specific bindings/overrides.

## Workspace alias namespace

Sibling packages are imported under `@upmind-automation/*`. Dev `paths` map each alias to source, e.g.:

```json
"@upmind-automation/types": ["../types/src/index.ts"]
```

`include` must list the corresponding source dirs (`["src/**/*", "../types/src/**/*", ...]`).

## Package set and dependency graph

```
types (standalone)
icons (standalone)
ui (standalone — external submodule)
i18n       → types
headless   → types, i18n
client-vue → types, i18n, headless, icons, ui
apps       → all packages
```

## Standalone / external-submodule packages

`types`, `icons`, `ui` are external submodules — NO references to other monorepo packages in their configs.

## Dev-workflow verify command (concrete)

```bash
rm -rf packages/*/dist 2>/dev/null; cd packages/headless && pnpm tsc -p tsconfig.json 2>&1 | grep "@upmind-automation" || echo "No errors"
```

## Worked fix — radix-vue type portability (base TS2742 pattern)

**File**: `packages/ui/src/ui/select-cards/types.ts`. `SelectCardsItemProps` and `SelectCardsProps` MUST NOT extend radix-vue `RadioGroupItemProps` / `RadioGroupRootProps` — inline a self-contained `PrimitiveBaseProps` instead. Symptom if reverted: `The inferred type cannot be named without a reference to 'radix-vue/dist/index'` in consuming packages.

## Worked fix — apps/cart build references (base TS6306 pattern)

`apps/cart/tsconfig.build.json` references MUST target build configs, e.g. `{ "path": "../../packages/types/tsconfig.build.json" }`, not the package directory `{ "path": "../../packages/types" }`.
