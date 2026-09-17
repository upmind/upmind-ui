# Adopting client-vue

The sandbox mocks what is new. Six client-portal families already exist as
`@upmind-automation/client-vue` components over `@upmind-automation/headless` modules, so
this app does not mock them: each of their routes renders one stub row ("Provided by
client-vue") naming the component that will mount there, and each door into one of them
from a surviving page resolves to the same sentence as prose. This file is the record of
what the real portal installs in their place, and what the legacy portal did there that
the storefront components do not yet do.

Ruled 2026-09-07: "we don't need to mock the client-vue components, as they are not new."

## What mounts where

| Route(s)                                                             | client-vue                                                                                   | headless                                                           | Stub                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| `/login` (+ two-factor step)                                         | `UpmAuthLogin`                                                                            | `auth`                                                             | `config/auth-pages.ts`                |
| `/register`                                                          | `UpmAuthRegister`                                                                         | `auth`                                                             | `config/auth-pages.ts`                |
| `/forgotten-password`                                                | `UpmAuthRecoverPassword`                                                                  | `auth`                                                             | `config/auth-pages.ts`                |
| `/logout`                                                            | `UpmAuthLogout`                                                                           | `auth`                                                             | `config/auth-pages.ts`                |
| `/billing/payment-methods`                                           | `PaymentDetails`, `StoredPaymentMethods`                                                     | `payment-details`, `payment-gateways`                              | `config/billing-pages.ts`             |
| invoice Pay (document control, list row, `?init=pay`)                | `PaymentDetails`, `PaymentAmount`, `AccountCredit`, `PaymentGateways`                        | `payment`, `invoices`                                              | `MOCK_ACTION.PAY_INVOICE` → prose     |
| product settings — payment method                                    | `StoredPaymentMethods`                                                                       | `payment-details`                                                  | `config/product-pages.ts`             |
| `/billing/orders`, `/billing/orders/[id]`                            | `UpmOrder` (`Order`, `OrderProducts`)                                                        | `orders`                                                           | `config/billing-pages.ts`             |

The two token-addressed logged-out pages (`/preferences`, `/preferences/email/opt-ins`)
and the delegate-invite acceptance page have no client-vue counterpart and stay mocked.
`useMockClientEmails` survives only because the opt-ins page writes a contact email's
topics through it.

## What legacy did there that client-vue does not yet do

Each line is a rule the removed mock code carried, transcribed from the legacy client
portal (`vue-app`). It is the gap list to close in client-vue or headless before the real
portal ships the family.

### Auth

- Organisation registration (`auth/registerOrg`) behind the brand's org-context gate.
- Reset with a token from the email link; an expired link reads as expired and offers
  a fresh one.
- Account verification and email verification from a link, with a set-password step
  and an expired state; a progress bar while the link's own half completes.
- The two-factor challenge as a second step of the same login page.
- reCAPTCHA and terms statements on the register form where the brand publishes them.

### Email history

- Status tabs (all, sent, bounced…), a search over subject and body, and the delivery-delay
  notice above the list.
- A detail page with the status, the recipients and timings as a spec, and the body as
  it was sent (markdown, collapsed past a line cap).

### Contacts

- One default per collection, set from the row; the default cannot be removed while
  something bills to it.
- Duplicate detection on phones (digits only) and addresses (squashed comparison).
- A company carries its own address, minted with it; tax number with a validation state.
- Contact-email verification by code, and resend of the verification email.
- The client's contact emails as a filtered collection with a search.

### Payment

- Pay an invoice in another currency the brand publishes a rate for; refuse a currency
  without one.
- Partial payments behind `PARTIAL_PAYMENTS_ENABLED`, with a minimum, and an additional
  payment on a part-paid document.
- Account credit spendable in the tender currency, plus the credit limit's remaining
  allowance; a summary of what credit covers.
- The pay guards in order: settled → clearing (money recorded but not landed) → currency.
- A new card at pay time: validated the same way whether kept or not; kept when the
  client ticks "save" or the brand forces storage (`BILLING_GATEWAY_FORCE_CARD_STORAGE`),
  in which case the tick box is withheld.
- Stored cards: default, rename, remove (refused while a product renews on it), verify
  again with the gateway, automatic settlement on/off, locked on when the brand forces it
  (`BILLING_GATEWAY_FORCE_AUTO_PAYMENT`).
- A brand with no card-storing gateway says so and offers no Add control.
- A child account sees the parent's cards as a read-only inherited panel and can pay with
  them, but cannot default or remove them.
- Which card a product renews on, chosen on the product's settings.
- The invoice's payment-method message with its Change/Select door, withheld on a
  delegated document and while a payment clears.

### Orders

- The order list with search, status filter and sort; standing per order (paid, pending
  payment, payment failed, partly paid, not paid, not paid with no gateways).
- Order detail: products, the invoices and credit notes it raised, Pay on the order's
  own open invoice, and cancellation of a cancellable order with confirmation.
- "Place an order" from an empty ledger, behind the store gate.

### Profile contacts

Mocked since 11 September 2026 (operator ruling: mock where no surface component exists).
No client-vue view serves the profile page, and no view is reachable for it either: the
billing tabs draw addresses, phones and companies, but `modules/billing/index.ts` publishes
only `UpmBilling` and `UpmBillingForm`. Whether the mock stays is the open export decision in
[`client-vue-placeholder-audit.md`](./client-vue-placeholder-audit.md) 2.1.
The four lists — emails, phones, and the addresses and companies legacy draws as one
"Address and company details" section — run on `mock/facades/useMockContacts.ts`, with
stand-in forms in `mock/contracts/client-contacts.schemas.ts` (`tests/profile-contacts.test.ts`).
The product's "Add a new address" and "Add company" doors open the same forms.

### Email history

Mocked since 11 September 2026. Client-vue's `emailHistory` module was retired in FE-3103, so
nothing was coming. The Logs page carries legacy's four status tabs over one list, the
delivery-delay notice, and the preview as a page under `/account/logs/emails/[id]`
(`mock/collection-defs.ts` `sentEmailsCollection`, `tests/email-history.test.ts`).

### Logged-out steps

Mocked since 11 September 2026. The reset link's new password (with the second-step code
while two-factor is on), the verification link's outcomes (activated, first password, expired),
the email-verification outcomes, and the organisation sign-up under "Get started for free"
are pages of their own (`config/auth-pages.ts`, `mock/contracts/auth.schemas.{reset,register-org}.ts`,
`tests/auth-steps.test.ts`). Sign-in, registration and password recovery still mount the real
client-vue organisms.

### Product setup

Mocked since 11 September 2026 (operator ruling: mock where no surface component exists).
`UpmProductSetup` is the basket funnel's repair step and never served this page (FE-3219).
The mock renders the provider's blueprint as one form whose Confirm is the setup step
(`mock/contracts/contract-product-provisioning.schemas.ts`, `tests/product-setup-form.test.ts`).

## Stand-in schema modules removed

`auth.schemas.{login,recover,register}`, `org-registration.schemas`,
`client-{email,phone,address,company}.schemas`, `client-payment-details.schemas`,
`payment-details.schemas`, `client-invoices.method.schemas`,
`contract-product-provisioning.schemas`, and the widenings `pay-with-new-card` and
`card-auto-payment`. The real modules stay the source of truth; nothing here grades them.

## Drift recorded at the develop merge (2026-09-07)

Develop's headless collections moved to the query-model API: actions `filterBy(intent)`,
`sortBy(intent)`, `setCriteria`, `reset`; context `query`, `schemas`. The mock's collection
generic (`mock/collections.ts`) still speaks the named-setter contract the toolbars were
built on. The one conformance exemplar (received emails) was retired with the email log, and
the contacts facade is no longer declared against the real module's types. Re-typing the
generic against a live module is the next mock phase, not a merge chore.
