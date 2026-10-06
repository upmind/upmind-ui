# @upmind-automation/product

The product configure page and the product rendering kit. The page reads a product, lets the
client configure it, and adds it to the basket. Other domain packages reuse the kit.
It holds the config form, the hero, the price atoms, the price list, the term rows and the
product card. The package also holds two form controls: the term choice and the sub-product
choice.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components, constants and
types. Read state from `@upmind-automation/headless` directly.

| Export | What it is |
| --- | --- |
| `UpmProductConfigure` | The main component of the configure page. |
| `UpmProductNotFound` | The view for a product that is not available. |
| `Config`, `ConfigErrors`, `ConfigSkeleton` | The configuration form, its error list and its loading state. |
| `ProductHero`, `ProductHeroSkeleton`, `ProductImage`, `PRODUCT_HERO_DIRECTION` | The product banner, its loading state, the image gallery and the banner directions. |
| `CurrentPrice`, `ExPrice`, `Promotion` | The price atoms. |
| `Pricing`, `PricingSkeleton`, `PricingTotal` | The price list, its loading state and its total row. |
| `TermRow`, `UpmTermsSelect` | One billing-term row, and the billing-term select. |
| `ProductCard`, `ProductCardSkeleton` | The product card and its loading state. |
| `productRenderers` | The two form controls: `Terms` and `SubProducts` (by UI schema type). |
| `ConfigureProps`, `ConfigProps`, `Item` | Types. |

## Render the main component on a page

The page picks the layout. The package knows no layout, and keeps no record of one. A normal
page is three lines:

```vue
<UpmProductConfigure :storefront-route="storefrontRoute" v-slot="{ template }">
  <component :is="productTemplate(template)" />
</UpmProductConfigure>
```

`UpmProductConfigure` resolves the brand's chosen template value and hands it to its own default
slot. The host page owns `productTemplate`, a pick function over its own template enum and
component map. It falls back to its own default for a name the map does not hold. Inside
`LayoutProvider` (from `foundation`), the package's own blocks then fill the layout's slots:
`product-details`, `image`, `configuration`, `pricing`, `markdown`, `actions`, `errors`, `total`
and `terms`. An empty block draws no frame: the block's own `v-if`, or the layout's empty-slot
check, hides it.

To replace one block, write that slot on the layout. The other blocks stay:

```vue
<UpmProductConfigure :storefront-route="storefrontRoute" v-slot="{ template }">
  <component :is="productTemplate(template)">
    <template #markdown>
      <TrustNote />
    </template>
  </component>
</UpmProductConfigure>
```

To keep a block's frame and replace only its content, use the main component's own named slot
and its slot props. The `product-details`, `configuration`, `pricing`, `actions`, `markdown`
and `terms` slots take this form. Put the layout in the default slot:

```vue
<UpmProductConfigure :storefront-route="storefrontRoute">
  <template #default="{ template }">
    <component :is="productTemplate(template)" />
  </template>
  <template #pricing="{ product, productMeta }">
    <ProductPricing :product="product" :meta="productMeta" />
  </template>
</UpmProductConfigure>
```

Props (`ConfigureProps`): `storefrontRoute` (required), `catalogueRoute`, `hideSlots` and
`hideTerms`. Event: `productDetails`. The setup waits for the product, so the component renders
inside a `<Suspense>` boundary.

## Form controls

`src/index.ts` registers `productRenderers` with `foundation`'s form registry when the package
loads. `package.json` lists `./src/index.ts` in `sideEffects`, so a build keeps the
registration. An app that renders product forms imports the package at startup.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/product/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless` and
`@upmind-automation/foundation`. These are the entries in its `tsconfig.json` `paths`.

It must not import:

- Any other domain package, or `@upmind-automation/client-vue`. The repo-root `vue-tsc -b`
  gate reports the import as `TS2307`.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
