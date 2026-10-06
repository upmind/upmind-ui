# @upmind-automation/basket

The in-flight order, before it converts to an invoice. The package holds the basket page, the
edit page of one basket product, the billing page, the checkout and the product setup step. The
checkout is a flow inside the basket, not a module of its own. The package reuses
`@upmind-automation/product`'s kit, `@upmind-automation/payment`'s payment-details form,
`@upmind-automation/client`'s rows and one slot-props type from `@upmind-automation/auth`.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components and types. Read
state from `@upmind-automation/headless` directly. The package knows no template names: it
draws none of its own pages' layouts, and exports none of their names either — the host app
owns every layout a basket page renders (see below).

| Export | What it is |
| --- | --- |
| `UpmBasket` | The main component of the basket page. |
| `UpmBasketProductEdit` | The main component of the edit page of one basket product. |
| `UpmBilling` | The main component of the billing page. |
| `UpmCheckout` | The main component of the checkout page. |
| `UpmProductSetup` | The setup step. It shows each product that still needs setup, one at a time, then goes on to the checkout. |
| `UpmBasketUnavailable` | The view for a basket that is not available. |
| `UpmBasketSummary` | The basket summary. |
| `UpmBasketProductCards` | The basket product cards. |
| `UpmBillingForm` | The billing details form. |
| `UpmCurrency`, `UpmCurrencySelect` | The currency switcher and the currency select. |
| `UpmGuestCheckoutOffer` | The guest-checkout offer. A page puts it in `UpmAuthRegister`'s `guest-checkout` slot. |
| `UpmCheckoutPricing` | The checkout price summary. |
| `BillingProps`, `BillingFormProps`, `CheckoutBillingProps`, `CheckoutContentProps`, `CheckoutPricingProps`, `CheckoutProductSetupProps`, `GuestEmailProps`, `ProductSetupProps`, `ProductSetupFormProps` | The prop types. |

## Render a main component on a page

Each main component wraps its template in `foundation`'s `LayoutProvider`: the page's layout
renders through the component's default slot, and the component's own named blocks fill that
layout's slots. The brand's evaluated template value is the only thing the default slot
carries — the component reads it from the brand config and picks no layout itself. The host
app owns the record of layouts for each page and a function that picks from it, with its own
fallback for a name the record does not hold. A normal basket page is three lines:

```vue
<UpmBasket :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }" v-slot="{ template }">
  <component :is="basketTemplate(template)" />
</UpmBasket>
```

`basketTemplate` is the host's own function: it looks `template` up in its own record of
layouts and falls back to its own default for a name the record does not hold. Each of this
package's five pages works the same way, each with its own record and its own pick function
(for example `checkoutTemplate`, `billingTemplate`, `productSetupTemplate` and
`basketProductTemplate`):

| Main component | Blocks |
| --- | --- |
| `UpmBasket` | `summary`, `products`, `pricing`, `total`, `markdown`, `checkout`, `custom-price` |
| `UpmBasketProductEdit` | `product-details`, `image`, `configuration`, `pricing`, `actions`, `errors`, `total`, `terms` |
| `UpmBilling` | `hero`, `back`, `content`, `content-footer` |
| `UpmCheckout` | `back`, `summary`, `content`, `pricing`, `errors` |
| `UpmProductSetup` | `configuration`, `content-header`, `aside`, `progress`, `actions` |

An empty block draws no frame: the block's own `v-if`, or the layout's empty-slot check, hides
it.

To replace one block, write that slot on the layout. The other blocks stay:

```vue
<UpmCheckout
  :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
  :billing-route="{ name: ROUTE.BILLING }"
  v-slot="{ template }"
>
  <component :is="checkoutTemplate(template)">
    <template #back>
      <BackToBasket />
    </template>
  </component>
</UpmCheckout>
```

Some blocks pass the layout scoped-slot props the host's own layout can read and override —
`UpmBasket`'s `pricing` block offers `showCheckout`/`showTotal`, and `UpmBasketProductEdit`'s
offers `showTotal`/`showActions`. A layout overrides one by binding it with `:` on the named
slot it writes, for example `<slot name="pricing" :show-total="false" />`; a bare, unbound
attribute sends nothing.

`UpmBasket`, `UpmBasketProductEdit` and `UpmProductSetup` wait for the basket in their setup,
so each renders inside a `<Suspense>` boundary.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/basket/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless`,
`@upmind-automation/foundation`, `@upmind-automation/product`, `@upmind-automation/payment`,
`@upmind-automation/client`, `@upmind-automation/auth` and `@upmind-automation/types`. These are
the entries in its `tsconfig.json` `paths`. Each edge points down: none of these packages
imports `basket`.

It must not import:

- Any other domain package, or `@upmind-automation/client-vue`. The repo-root `vue-tsc -b`
  gate reports the import as `TS2307`.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
