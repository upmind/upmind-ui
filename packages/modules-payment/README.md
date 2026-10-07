# @upmind-automation/payment

Make a payment against one invoice. The package holds the pay block of the order page, the
payment-details form (gateway, stored card, amount, account credit, pay later) and the
processing view. The checkout and the order page also render the payment-details form. The package also
holds two form controls: the gateway choice and the stored-card choice.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components, constants and
types. Read state from `@upmind-automation/headless` directly.

| Export | What it is |
| --- | --- |
| `UpmPayment` | The pay block for one invoice: the payment-details form while the invoice can take a payment, then the processing view. |
| `UpmPaymentDetails` | The payment-details form. |
| `UpmPaymentProcessing` | The view that shows while a payment processes. |
| `paymentRenderers` | The two form controls. One matches an enum field whose scope ends in `gateway_id`, the other one whose scope ends in `payment_details_id`. |
| `PaymentProps`, `PaymentDetailsProps`, `PaymentGatewayProps`, `PaymentGatewaysProps`, `StoredPaymentMethodProps`, `PaymentActionsProps`, `AccountCreditProps`, `PaymentAmountProps`, `PaymentNotRequiredProps`, `PaymentGatewaysUnavailableProps`, `FormModalProps` | The prop types. |

The stored-card chooser (`StoredPaymentMethods`) is internal. It renders inside
`UpmPaymentDetails`, and the package does not publish it.

## Render the main component on a page

`UpmPayment` draws no layout and has no layout slots. A page mounts it with the invoice id:

```vue
<UpmPayment :invoice-id="invoiceId" />
```

Props (`PaymentProps`): `invoiceId` (required). The setup waits for the invoice, so the
component renders inside a `<Suspense>` boundary. It provides `usePaymentDetail` and
`usePaymentChallenge` to the form below it.

`UpmPayment` shows nothing when the invoice is not available: an unknown invoice, a signed-out
client, or an invoice that is paid. It has no order summary, no order alerts and no retry
action. After a successful charge, the page is blank.

## Form controls

`src/index.ts` registers `paymentRenderers` with `foundation`'s form registry when the package
loads. `package.json` lists `./src/index.ts` in `sideEffects`, so a build keeps the
registration.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/payment/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless`,
`@upmind-automation/foundation` and `@upmind-automation/types`. These are the entries in its
`tsconfig.json` `paths`.

It must not import:

- Any domain package, `@upmind-automation/invoice` included, or `@upmind-automation/client-vue`.
  The repo-root `vue-tsc -b` gate reports the import as `TS2307`. The standalone payment app
  depends on this package and the shared bases only.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
