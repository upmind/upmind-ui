> Companion to the upmind-agent skill /docs-glossary — Upmind-monorepo-specific bindings/overrides.

## Glossary source and schema (base "Entry format")

- The glossary source is `docs/corpus/glossary.yaml`. It is the only hand-authored file under `docs/corpus/`. `docs/corpus/build.mjs` compiles it into `corpus.glossary.terms`.
- The entry schema is the `GlossaryTerm` type in `docs/corpus/corpus.types.ts`, with the format and referent-id conventions in the header comment of `glossary.yaml`:
  - `symbol` → `"@upmind-automation/headless!<export>"` (TypeDoc `package!export`)
  - `adr` → `"adr:<basename-without-extension>"`
- The FE-2752 design that first set this format is not in the tree. The schema above is the binding.

## Drift gate (base "Drift-gated")

`docs/corpus/gates/gate-symbols.mjs` (`gate:symbols`, FE-2753) fails CI when a referent id no longer resolves in `corpus.index`.

## Terms that look like aliases but are not

`cart` is not an alias of `basket`. The basket is the domain concept (the in-progress order); `cart` is the storefront app (`apps/cart`) that renders it. They are two entries.
