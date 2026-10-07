# @upmind-automation/catalogue

Browse the store: the catalogue page, the category tree and the product grid. The page shows
the store or category heading, the categories, and the category's products. For a category that
asks for the domain search, the page shows the domain search widget from
`@upmind-automation/domain` in place of the product grid.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components and types. Read
state from `@upmind-automation/headless` directly. The package draws no layout and knows no
template name of its own — the host app owns the page's record of layouts (see below).

| Export | What it is |
| --- | --- |
| `UpmCatalogue` | The main component of the catalogue page. |
| `UpmCategories` | The category header and the category list. |
| `UpmProducts` | The product grid of one category. |
| `CategoriesProps`, `CategoriesItemProps`, `CategoriesFacetProps`, `ProductsProps`, `ProductSortProps` | The prop types. |

## Render the main component on a page

`UpmCatalogue` wraps its template in `foundation`'s `LayoutProvider`. The page's layout renders
through the component's default slot, carrying the brand's evaluated template value. The
component's own named blocks then fill that layout's slots. The host app owns the record of
layouts and a function that picks from it, with its own fallback. A normal page is three lines:

```vue
<UpmCatalogue :category-route="{ name: ROUTE.CATALOGUE }" v-slot="{ template }">
  <component :is="catalogueTemplate(template)" />
</UpmCatalogue>
```

`catalogueTemplate` is the host's own function. It looks `template` up in its own record of
layouts and falls back to its own default for a name the record does not hold. The blocks are
`content-header` (the categories and breadcrumbs) and `content` (the facets and the product
grid or the domain search). While the domain search shows, the `aside-footer` and
`content-footer` blocks also render. They hold the `#domain-aside-footer` and
`#domain-content-footer` targets that the domain search teleports its hint and its continue
action to.

To replace one block, write that slot on the layout. The other blocks stay:

```vue
<UpmCatalogue :category-route="{ name: ROUTE.CATALOGUE }" v-slot="{ template }">
  <component :is="catalogueTemplate(template)">
    <template #content-header>
      <StoreHeading />
    </template>
  </component>
</UpmCatalogue>
```

Props: `categoryRoute` (required) and `configureRoute`. The selected category is the `catid`
query parameter.

## The domain search

`UpmCatalogue` shows the domain search when the category's `uiMeta.widgets.dac` is set, or when
the brand's product-list style is `DAC`. `products/WidgetDAC.vue` then loads `UpmDacWidget`
with a dynamic import, so the `domain` code sits in its own chunk. A catalogue that never shows
the search never loads it. The widget takes no props and places its own blocks. It reads no
record of layouts, from the host or from this package.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/catalogue/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless`,
`@upmind-automation/foundation`, `@upmind-automation/product` and `@upmind-automation/domain`.
These are the entries in its `tsconfig.json` `paths`. It imports `domain` only through the one
dynamic import in `products/WidgetDAC.vue`.

It must not import:

- `domain` statically at any hop, or through a second dynamic import.
  `src/__tests__/boundary.test.ts` fails on either.
- Any other domain package, or `@upmind-automation/client-vue`. The repo-root `vue-tsc -b`
  gate reports the import as `TS2307`.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
