# @upmind-automation/foundation

The one shared base every ADR 023 domain package is allowed to depend on. It
resolves the storefront's brand-invariant configuration, selects (but does
not apply) the active theme, and reads the form-renderer set its host
provides.

See [ADR 023](../../docs/adr/023-ui-domain-package-architecture.md) §2 for
the layer's place in the package graph and its two invariants.

## Public surface

| Export                                                       | What it does                                                                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `useBrandConfig`                                             | Resolves the storefront's brand-invariant config, cached by settings-bundle id (ADR 023 §10 Axis 1).                  |
| `useThemeEngine`, `provideThemeEngine`, `THEME_ENGINE`       | The theme-application seam. `foundation` selects; it never implements an engine (ADR 023 §2).                         |
| `useBrandTheme`                                              | Resolves which theme id and colour scheme the storefront should use, and hands the id to whatever engine is provided. |
| `useFormRenderers`, `provideFormRenderers`, `FORM_RENDERERS` | Reads the form-renderer set the host provided — an empty set when no host provided one.                               |

**Routes and funnel flows are not here.** An app owns its own router. It
composes its route array from the records a package exports, and calls that
package's flow registrar with its own router instance — the shape
`apps/cart/src/router/` has always had. A registry in this package would only
send those records on a round trip to reach the app that already imported
them.

## Renderer entries live in the app, never here

**A renderer entry never lives in this package.** An app composes its set from
the packages it already imports and provides it once, at app level, under
`FORM_RENDERERS`. `foundation` only ever supplies the read side
(`useFormRenderers`).

**Why this is the one invariant not to break.** Every domain package already
imports `foundation`. If a renderer entry were declared inside `foundation`
instead, `foundation` would have to import that domain package back —
`foundation → your-package` — which, combined with `your-package →
foundation`, is a real typed cycle. An app has no such problem, because an app
may import any domain package. `pnpm exec vue-tsc -b` (the project-reference
gate) is what would catch it; do not widen a `paths` map to work around a
failure there — it means an entry landed in the wrong file.

## Theme selection vs. theme application

`useBrandTheme().apply()` hands the resolved theme id to whatever is
injected at `THEME_ENGINE`. Until something provides one with
`provideThemeEngine`, `apply()` resolves and returns normally but changes
nothing on screen — resolving a selection and applying it are two separate
steps, and this package only ever performs the first.
