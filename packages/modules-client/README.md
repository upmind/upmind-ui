# @upmind-automation/client

The client's editable profile records: addresses, companies and phones. The package holds two
form controls and three rows. The controls draw an address form and a manage list inside a
schema-driven form. The rows draw one record each inside `foundation`'s manage kit.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components. Read state from
`@upmind-automation/headless` directly.

| Export | What it is |
| --- | --- |
| `clientRenderers` | The two form controls. One matches a layout of UI schema type `address`, the other a control of UI schema type `Manager`. |
| `AddressItem`, `CompanyItem`, `PhoneItem` | The rows for `foundation`'s `Manage`. Each takes one `headless` record (`Address`, `Company`, `Phone`) and emits `edit`. |

## Render on a page

The package has no main component and draws no layout. A page does not mount it. A form that
shows an address or a manage list renders the package's controls through `foundation`'s `Form`.
A manage list renders the rows through `Manage`'s `item` slot.

## Form controls

`src/index.ts` registers `clientRenderers` with `foundation`'s form registry when the package
loads. `package.json` lists `./src/index.ts` in `sideEffects`, so a build keeps the
registration. An app that renders client forms imports the package at startup.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/client/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless` and
`@upmind-automation/foundation`. These are the entries in its `tsconfig.json` `paths`.

It must not import:

- Any domain package, or `@upmind-automation/client-vue`. The repo-root `vue-tsc -b` gate
  reports the import as `TS2307`.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
