# SDD 03 — Catalogue browse

## Goal

A visitor lands on the storefront and browses the test brand's catalogue: a paginated grid of products renders in the brand currency, and the category tree drives navigation. Clicking a card routes to the product page, which is feature 4's surface — this feature ends at the click.

## Depends on

- Feature 2 (Brand bootstrap) — brand currency is the active currency for catalogue listings; brand bootstrap also seeds the active language for the `lang` query.

## Modules consumed

- `productCatalogue` — see [02-module-foundations/productCatalogue.md](../02-module-foundations/productCatalogue.md)
- `productCategories` — see [02-module-foundations/productCategories.md](../02-module-foundations/productCategories.md)

> The single-product read, product page render, and the full configurator (options / attributes / term / quantity / provision fields) all live in SDD 04 alongside the seat call they feed.

## Reads (before generating any code)

- `06-initiator/generic.md` — sections 9 (validation checklist) and 10 (operating principles, especially #9: `basket_id` on catalogue reads costs)
- `03-foundations-chapter.md` — full chapter (§1 HTTP transport, §3 currency injection, §4 error model)
- `02-module-foundations/productCatalogue.md` — full
- `02-module-foundations/productCategories.md` — full

## What this feature does

1. Catalogue page mounts. Read the active currency from the foundations layer's currency slot (set by feature 2's brand bootstrap). If currency isn't ready, wait — don't fire the read against a missing currency.
2. Issue the catalogue listing read: `GET /basket/products?limit=20&offset=0&currency_code=<active>&lang=<active>&with=image,images,prices,products_attributes,products_options,products_options.prices,category.top_category.top_category.top_category.top_category&order=order&filter[provision_blueprint.category.code|neq]=domain-names`. **No `basket_id`** on broad browsing — operating principle #9.
3. Issue the category tree read once: `GET /basket/products_categories?with=subcategories.image,subcategories.subcategories.image,subcategories.subcategories.subcategories.image,subcategories.subcategories.subcategories.subcategories.image&with_count=products,subcategories.products,subcategories.subcategories.products,subcategories.subcategories.subcategories.products,subcategories.subcategories.subcategories.subcategories.products&limit=0&lang=<active>`. Cache it for the session.
4. Render the catalogue grid from the listing's `data[]` (each card: `name_translated`, `image.image_url`, `display_price`, an options-grid badge if `products_options.length > 0`). Render the category tree filtered to `category_type === 1` — the tree walker (see productCategories ops 5-7) resolves root → children → grandchildren navigation off the cached tree.
5. On category click: re-issue step 2's read with `filter[products_category_id]=<categoryId>` and `offset` reset to `0`. Replace the rendered slice. Derive page count from the response's `total` (`Math.ceil(total / limit)`).
6. On pagination control: re-issue step 2's read with the new `offset = (page - 1) * limit`, same filters. Replace the slice; do not append.
7. On product card click: route to `/product/{id}`. **That route is feature 4's surface** — feature 4 reads the single-product configure shape, renders the product page, drives the configurator, and owns add-to-basket.

## Data shapes (feature-scoped)

View-models the feature assembles from the module-foundation types. Full types live in the module foundation docs.

```ts
// Listing page — what the catalogue grid renders
type CatalogueListPage = {
  items: ProductSummary[];        // mapped from CatalogueProduct[] in productCatalogue.md
  pagination: {
    page: number;                 // 1-indexed
    perPage: number;              // matches the `limit` query param
    total: number;                // from response.total (unpaginated count)
  };
  activeCategoryId: string | null;
};

// Card-shape projection used by the grid
type ProductSummary = {
  id: string;
  name: string;                   // CatalogueProduct.name_translated
  shortDescription: string | null;// CatalogueProduct.short_description_translated
  image: string | null;           // CatalogueProduct.image?.image_url
  displayPrice: string;           // CatalogueProduct.display_price (formatted, brand currency)
  hasOptions: boolean;            // CatalogueProduct.products_options.length > 0
  categoryId: string;
};

// Category tree — navigation shape (see ProductCategoryRecord in productCategories.md)
type CategoryTreeNode = {
  id: string;
  name: string;                   // name_translated
  parentId: string | null;
  level: number;
  productsCount: number;          // own count, not descendant rollup
  image: string | null;           // image?.image_url when expanded
  subcategories: CategoryTreeNode[];
};
```

## API calls (in execution order)

| Step | Method | Endpoint | Purpose | Fixture |
| --- | --- | --- | --- | --- |
| 1 | GET | `/basket/products?limit=20&offset=0&currency_code=<code>&lang=<lang>&with=…&order=order&filter[provision_blueprint.category.code\|neq]=domain-names` | Top-level catalogue listing — broad browse, **no `basket_id`** | `07-references/recordings/get-basket-products-0aea5e9f.json` |
| 2 | GET | `/basket/products_categories?with=subcategories.image…(×4)&with_count=products…(×4)&limit=0&lang=<lang>` | Category tree (one-shot, cached for the session) | `07-references/recordings/get-basket-products_categories-f13c8b36.json` |
| 3 | GET | `/basket/products?…&filter[products_category_id]=<id>` | Category-filtered listing (re-issue of step 1 with category filter) | Same fixture shape as step 1, different hash |
| 4 | GET | `/basket/products?…&offset=<n*limit>` | Pagination cursor move (re-issue of step 1 with new offset) | Same fixture shape as step 1 |

**Explicit:** NO `?basket_id=` on any of these calls. Operating principle #9 — supplying `basket_id` makes the back end recompute every returned price row against the basket's promotions and option overrides, on every request, on every card on every page. Broad browsing doesn't need basket-accurate prices; pay that cost in feature 4 (single-product configure read) when the visitor is in-basket.

## Edge cases

- **Transport unwrap must preserve `total`.** A naive transport that returns only `body.data` loses the pagination cursor — every list-endpoint call this feature makes (`/basket/products`, `/basket/products_categories`) needs `body.total` for `Math.ceil(total / limit)`. If feature 0's transport returns `data` only, extend it to a `requestList<T>()` shape (`{ data: T[], total: number }`) before this feature builds. See foundations §1.3.
- **Image URLs are relative paths.** Product `image_url` values come back as platform-relative paths like `/api/images/{id}/download`. Without prepending `${api_base}` before binding to `<img src>`, the browser resolves them against the dev server origin and 404s. Either bake a `resolveImageUrl(url)` helper into the foundations layer or always emit absolute URLs at the boundary. See foundations §1.1.
- **Empty catalogue.** Test brand may have no products published yet — `data: []` with `total: 0`. Render a "no products yet" empty state, not a blank grid.
- **Category tree pre-fetched at catalogue mount.** Don't re-fetch the tree on every category click or pagination move — it's a one-shot read keyed to the session. Cross-ref: `productCategories.md` lesson "the whole tree comes back in one request, and pagination is not a way out".
- **Pagination boundary.** End-of-list signal is `(offset + data.length) >= total` (per `productCatalogue.md` lessons). Disable the "next" control at the last page; don't crash on an over-shot offset.
- **Filter mid-pagination.** A category change resets `offset` to `0` and replaces (not appends) the rendered slice. The previous page's `total` is invalid for the new filter — re-read `total` from the new response.
- **Currency mismatch on a card.** A product with no price row for the active currency arrives with `prices: []` — the headline `display_price` may still be populated against a fallback, but treat an empty `prices` array as "not sellable in this currency" and either hide the card or grey it out. Should be rare if brand bootstrap set currency correctly.
- **Domain-name products.** The catalogue read already excludes them server-side via `filter[provision_blueprint.category.code|neq]=domain-names` (per `productCatalogue.md`). They never reach the grid. **App-side filtering is not the platform contract** — if the prototype wants finer-grained filtering (e.g. hide a `module_code` it doesn't render), do it client-side; don't assume the platform will hide it for you.
- **Translated field fallback.** `name_translated` silently falls back to `name` when no translation exists for the active locale — the storefront can't detect the fallback from the field alone (per `productCategories.md` lesson on translated/untranslated divergence). Render the `*_translated` field; don't compare against the source.
- **Headline price is editorial.** `display_price` is the catalogue editorial headline (lowest cycle, or lowest monthly-equivalent — brand-policy driven). It is **not** what the customer pays. Feature 4's product page + configurator + seat surface the actually-payable price.

## Validation checklist

- [ ] Catalogue page renders the test brand's products with `name_translated`, primary image, and `display_price` in the brand currency
- [ ] Pagination works: page 1 → page 2 → page 1, response `total` drives the page count
- [ ] Category tree renders, filtered to `category_type === 1`, and is navigable root → children → grandchildren
- [ ] Clicking a category re-issues the listing with `filter[products_category_id]` and replaces (not appends) the rendered slice
- [ ] Clicking a product card routes to `/product/{id}` (feature 4 owns the page render)
- [ ] **No `basket_id` query parameter on any listing or category tree read** — verify in the Network tab on every request
- [ ] Empty catalogue renders a friendly empty state (not a blank screen)
- [ ] Every request carries `Host: <brand_domain>` (per foundations §1.1) and `Authorization: Bearer <guest-or-client-token>` (per foundations §2.3)

## Notes for the agent

- The catalogue is a public storefront surface. Anonymous visitors browse with a guest token; no client login is required. (Per `03-foundations-chapter.md` §2.1: guest tokens authorise brand reads, catalogue reads, and basket create/read/mutate.)
- The currency for listings is the active currency from the foundations layer's currency slot, set by feature 2's brand bootstrap. The catalogue does not negotiate currency itself — it consumes whatever's in the slot.
- **Do not send `basket_id` on listings or the category tree.** Operating principle #9 is hard-coded into this feature. Basket-scoped recomputation belongs to feature 4 (single-product configure read) when the visitor has a basket and needs basket-accurate prices.
- **The product page and configurator are not this feature's responsibility.** Term selectors, option pickers, attribute pickers, quantity controls, provision-field forms, and the single-product read live in SDD 04 alongside the seat call they drive. Feature 3's job ends at the card click.
- Search (`?query=`) is optional only if the spine settles early. Not required for "done".
- Multi-currency switching is out of scope. The active currency is the brand's default for the duration of the session.
- The catalogue read's per-item shape is the same record `product` returns standalone — same fields, different `with` expand. Feature 4 re-fetches with the configure-shape expand when the visitor lands on the product page (per `productCatalogue.md` lesson "the catalogue list and the configure surface use the same endpoint family with different expands").
- The category tree's "in your basket" join (badging cards that are already in the basket) is the caller's responsibility — not built in feature 3. Becomes relevant in feature 4 onward.
