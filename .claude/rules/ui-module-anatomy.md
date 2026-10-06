---
id: ui-module-anatomy
when: a file is added to a UI module package
paths:
  - 'packages/modules-*/src/**'
  - 'packages/client-vue/src/modules/**'
---
# A UI module keeps one fixed anatomy

A UI module package `packages/modules-*` keeps each concern in its named place under `src/`. Put a new file in the place that names its concern:

| Place | Holds |
| --- | --- |
| `index.ts` | The public barrel. It exports the views, components, renderers and types. It registers the package's renderers with `registerFormRenderers` from `@upmind-automation/foundation`. |
| `types.ts` | The props types and the other public types. |
| `variants.ts` | The `cva` exports that the templates call. |
| `styles.css` | The stylesheet entry for the package. |
| `components/` | The `.vue` components. |
| `renderers/` | Optional. The form renderers, with their own `index.ts`. |
| `*.utils.ts` | Optional. Pure helpers, named for their subject. |
| `__tests__/` | The tests and their support files. |

`packages/modules-foundation/src` is split by feature: `hero/`, `manage/`, `section/` and the others. Each feature folder repeats this anatomy. It holds its own `index.ts` and `types.ts`, and `variants.ts` when it has classes.

`packages/client-vue/src/modules/**` is retiring. A change there follows the `modules-*` anatomy.

The test: each file sits in the place that names its concern. Do not add a new top-level kind of file. Do not put a type, a `cva` export or a helper in a component file.

Exemplar: `packages/modules-payment/src`.
