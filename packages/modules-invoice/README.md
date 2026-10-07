# @upmind-automation/invoice

The order page. An order is a type of invoice, so the package is named `invoice`. The page shows
one order after checkout. It shows the order's status, the pay block while payment is due, and
the order's details and products. For a guest client, it also shows the offer to register. The pay block comes from
`@upmind-automation/payment`, and the guest registration form from `@upmind-automation/auth`.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components, constants and
types. Read state from `@upmind-automation/headless` directly.

| Export | What it is |
| --- | --- |
| `UpmOrder` | The main component of the order page. |
| `UpmOrderProducts` | The table of the order's products. |
| `detailsSkeletonItemVariants`, `detailsSkeletonRootVariants`, `detailsSkeletonRowVariants`, `detailsSkeletonTotalRowVariants`, `detailsTotalLabelVariants`, `detailsTotalRootVariants`, `detailsTotalValueVariants` | The class variants of the details list and its loading state. |
| `OrderProps` | Types. |

## Render the main component on a page

The page picks the layout. The package knows no layout, and keeps no record of one. A normal
page is three lines:

```vue
<UpmOrder v-slot="{ template }">
  <component :is="orderTemplate(template)" />
</UpmOrder>
```

`UpmOrder` resolves the brand's chosen template value and hands it to its own default slot. The
host page owns `orderTemplate`, a pick function over its own template enum and component map. It
falls back to its own default for a name the map does not hold. Inside `LayoutProvider`
(from `foundation`), the package's own blocks then fill the layout's slots: `order-summary`,
`order-payment-details`, `order-details`, `order-products` and `guest-registration`. A block
that has nothing to show for the order's state renders no slot.

To replace one block, write that slot on the layout. The other blocks stay:

```vue
<UpmOrder v-slot="{ template }">
  <component :is="orderTemplate(template)">
    <template #guest-registration>
      <RegisterPrompt />
    </template>
  </component>
</UpmOrder>
```

`UpmOrder` reads the order id from the route parameters. Props (`OrderProps`): `storefrontRoute`
and `registerRoute`. With a `registerRoute`, a guest client goes to that route to register, and
the `guest-registration` block does not render. The setup waits for the order, so the component
renders inside a `<Suspense>` boundary.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/invoice/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless`,
`@upmind-automation/foundation`, `@upmind-automation/payment` and `@upmind-automation/auth`.
These are the entries in its `tsconfig.json` `paths`.

It must not import:

- Any other domain package, or `@upmind-automation/client-vue`. The repo-root `vue-tsc -b`
  gate reports the import as `TS2307`.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
