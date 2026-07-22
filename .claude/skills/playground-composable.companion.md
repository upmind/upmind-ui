> Companion to the upmind-agent skill /playground-composable — Upmind-monorepo-specific bindings/overrides.

## Playground app & paths

- `<playground-app>` (base Steps 1–2) = **`playgrounds/labs`**. Pages live at `playgrounds/labs/src/pages/use{ComposableName}/`.
- Keep the `use` prefix on both folder and route name (`useAuth/`, `useCart/`).

## Imports & components (base Step 2 template)

- `<your-ui-kit>` splits across two packages:
  - Layout + form come from **`@upmind-automation/client-vue`**: `UpmLayout`, `UpmForm`, `formRenderers`.
  - UI primitives come from **`@upmind-automation/upmind-ui`**: `Card`, `Button`.
- `<your-headless-package>` = **`@upmind-automation/headless`** — source of `use{ComposableName}`, `use{Schema}`, `use{Uischema}`.
- `<PlaygroundLayout>` binds to `UpmLayout`.
- `<SchemaForm>` binds to `UpmForm`; the base `:layout` prop binds to `:uischema`, and `use{Layout}` binds to `use{Uischema}`. Feed `:additional-renderers="formRenderers"` and set `no-actions` `as="fieldset"`:

  ```vue
  <UpmForm
    :schema="schema"
    :uischema="uischema"
    :model-value="context.model"
    :additional-renderers="formRenderers"
    no-actions
    as="fieldset"
    @update:model-value="actions.set($event)"
  />
  ```

- Concrete template imports:

  ```ts
  import { UpmLayout, UpmForm, formRenderers } from "@upmind-automation/client-vue";
  import { Card, Button } from "@upmind-automation/upmind-ui";
  import { use{ComposableName}, use{Schema}, use{Uischema} } from "@upmind-automation/headless";
  ```

- Styling is Tailwind — mirror the reference page's utility classes: page shell `mx-auto max-w-4xl space-y-8 p-8`, section/card shell `rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900`, headings `text-xl font-semibold`, state block `bg-neutral-100 p-4 rounded dark:bg-neutral-800`.

## Route auto-registration (base Step 3)

- Routes auto-register via `import.meta.glob` in `router.ts` — no manual wiring.
- `meta.nav`: `label` and `name` = `use{ComposableName}`; `section` = `"Composables"`; `order` increments per new composable.

## Verify command (base Step 4)

- `<playground-dev-command>` = **`npm run dev --filter=labs`**.

## Reference implementation (base "Reference Implementation")

- Canonical example: **`playgrounds/labs/src/pages/useAuth/`** — `Index.vue` (full playground with forms + state display) and `routes.ts` (self-registering route config).

## Icon set (base "Icons")

The icon component accepts these names; suggested composable→icon mapping:

| Composable | Icon |
|------------|------|
| Auth | `lock-01` |
| Cart | `shopping-cart-01` |
| Session | `user-01` |
| Products | `box` |
| Payments | `credit-card-01` |
| Default | `beaker-01` |
