# @upmind-automation/recommendations

The upsell and cross-sell pages. Each page shows the recommended products as cards. The client
adds one to the basket, configures it if it needs configuration, or skips the page. The cards
come from `@upmind-automation/product`'s product card.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components and types. Read
state from `@upmind-automation/headless` directly. The package draws no layout and knows no
template name of its own — the host app owns the page's record of layouts (see below).

| Export | What it is |
| --- | --- |
| `UpmRecommendations` | The main component of the basket recommendations page (`useRecommendations`). |
| `UpmProductRecommendations` | The main component of the recommendations page for one product. It reads the product id from the query parameters (`useProductRecommendations`). |
| `RecommendationsPageProps` | The prop type: `configureRoute`. |

## Render a main component on a page

Each main component wraps its template in `foundation`'s `LayoutProvider`. The page's layout
renders through the component's default slot, carrying the brand's evaluated template value.
The component's own named blocks then fill that layout's slots. The host app owns the
record of layouts and a function that picks from it, with its own fallback. A normal page is
three lines:

```vue
<UpmRecommendations :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }" v-slot="{ template }">
  <component :is="recommendationsTemplate(template)" />
</UpmRecommendations>
```

`recommendationsTemplate` is the host's own function. It looks `template` up in its own record
of layouts and falls back to its own default for a name the record does not hold. The blocks
are `hero`, `cards`, `configure` and `footer`. The `footer` block renders only when there are
recommendations.

To replace one block, write that slot on the layout. The other blocks stay:

```vue
<UpmRecommendations :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }" v-slot="{ template }">
  <component :is="recommendationsTemplate(template)">
    <template #hero>
      <OffersBanner />
    </template>
  </component>
</UpmRecommendations>
```

The `hero` block is also a named slot of the main component. Its default is `foundation`'s
`Hero`.

Props (`RecommendationsPageProps`): `configureRoute` (required). The setup waits for the
recommendations, so the component renders inside a `<Suspense>` boundary.
`UpmProductRecommendations` takes the same props and the same blocks.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/recommendations/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless`,
`@upmind-automation/foundation` and `@upmind-automation/product`. These are the entries in its
`tsconfig.json` `paths`. The edge to `product` is one-way: `product` does not import this
package.

It must not import:

- Any other domain package, or `@upmind-automation/client-vue`. The repo-root `vue-tsc -b`
  gate reports the import as `TS2307`.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
