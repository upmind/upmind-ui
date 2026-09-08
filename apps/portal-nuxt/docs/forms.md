# Forms

How a multi-field write gets on screen: one form module, a registry of what to put in
it, and — where a capability already has a real schema on the platform — a stand-in that
mirrors it rather than a hand-authored substitute.

## The form module

`app/portal/modules/form/Form.vue` is the only wrapper around the design system's JSON
Forms engine (`@upmind/ui`'s `Form`) in this app — there is no per-form component. Its
props (`app/portal/modules/form/types.ts`) are entirely data: `schema`, an optional
`uischema`, the `model` it opens with, a `submit` verb (already carrying an entity id
where the form edits one), the submit/reset labels, and optional `readonly`/`autosave`.
It clones the incoming model into a local draft so the engine can write into its own
copy without mutating the selector output it was handed, passes the app's shared ajv
instance, and on a successful submit emits `select` with `<submit>:<json-encoded model>`
— the same free-text-tail convention every other verb with a payload uses. Reset puts
the opening model back.

Beyond the fixed reset/submit pair, a registry entry may declare `extraActions` — a
list of `{ value, label }` controls the form renders between them. Each dispatches its
own verb bare when pressed, not the submit's `<verb>:<json>` convention, so it reaches
the dispatcher directly rather than resolving through the form's own submit. The share
dialog below is the one form using this channel so far: Regenerate and Copy both ride
it.

## Two placements

- **Inline** — a `form` row sits directly in a page's composition
  (`app/portal/config/*.ts`), fed by data refs for its schema/uischema/model exactly like
  any other module. Its submit goes through the same dispatcher door as a button press.
  Used for the profile, custom-fields, username, password, billing-settings, product
  label/consolidation/setup, new-ticket, and both token-page (`/preferences`,
  `/preferences/email/opt-ins`) forms, plus every logged-out auth screen.
- **Dialog** — a row action emits `open-form:<formId>` or `open-form:<formId>:<entityId>`.
  The dispatcher turns that into `MockActionResult.form = { id, entityId? }`, and the
  shell's one form dialog (`shell/PortalFormDialog.vue`) resolves the named entry from
  the registry (`mock/forms/registry.ts`) and mounts the form module on it. The dialog
  itself carries no knowledge of any individual form — it only knows how to open one and
  close it on a successful receipt.

## Stand-in schema modules

The families client-vue already ships (auth, contacts, payment, orders, product setup)
have no stand-in here any more — see `client-vue-adoption.md`.

Several of the forms below mirror a schema the real platform already defines
(client email/phone/address/company, two-factor auth, the auth screens, card entry).
Importing those real files at runtime turned out not to be viable: they sit behind a
package barrel whose import graph interprets a routing state machine as a side effect of
being loaded at all, which broke a large share of this app's own test suite the one time
it was tried. Instead, each of those forms is served by a **stand-in module** under
`app/portal/mock/contracts/*.schemas.ts` — transcribed export-for-export (same exported
names, same parameters, same shape) from the real file it mirrors, with a header comment
naming that file. `tests/standin-schemas.test.ts` is what keeps the two from drifting: it
imports the real file's raw source, transpiles and evaluates it in a sandbox, and
deep-compares its exports against the stand-in's — so an edit to the real schema that
isn't carried over to its stand-in fails the suite, not silently rendering a different
form. Each stand-in's own header also declares any deliberate divergence — where the
design system offers no equivalent control (the relation-picker "Manager" style renderer
on the company form is replaced by plain enum pickers, for one), or where a field only
makes sense in the mock (the card-entry stand-in adds the three raw card fields and a
title the real ADD schema doesn't carry; every stand-in adds its own `*Defaults()`
export, since only the mock needs one).

The two-factor enable dialog widens its stand-in rather than editing it:
`mock/forms/twofa-enrolment.ts` states the account's own setup key and the `otpauth://`
link an authenticator app enrols from as two read-only rows above the transcribed code
box — legacy drew a QR image over the same link; this build ships no image assets, so the
link stands alone, with no copy action. Turning two-factor off asks for the same
six-digit code before the write goes through; a code that isn't six digits refuses
without touching the account.

Everywhere a capability has **no** real schema to mirror, its form is served by a local
schema module of its own, written directly against the same JSON Schema / UI Schema
shape.

## Validation

`mock/forms/ajv.ts` builds one ajv instance the same way the platform's own validation
wrapper does: the same options, the same formats, and the same custom keywords —
`required_with`, `required_without`, `same` (value equals another field — used for
confirm-password style checks), `different`. `tests/ajv-parity.test.ts` is what keeps
the two lists in step.

## Reference data

Some renderers need lists a schema can't carry itself — country/region choices for an
address, a currency list for a money field. `mock/forms/engine-data.ts` builds these
once as a static fixture (twelve countries, enough for every seeded address and dialling
code) and the layout provides it before any form mounts, exactly as the design system's
own form README describes.

## Registered forms

Built from `mock/forms/ids.ts`, `mock/forms/registry.ts` and the submit cases in
`mock/actions.ts`.

| Form                                  | Placement | Page / trigger                                                                | Submit verb                                                                | Write method                                                |
| ------------------------------------- | --------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Personal details                      | inline    | `/account/profile`                                                            | `profile-save`                                                             | personal details facade `saveProfile`                       |
| Custom fields                         | inline    | `/account/profile`                                                            | `custom-fields-save`                                                       | personal details facade `saveCustomFields`                  |
| Change username                       | inline    | `/account/security`                                                           | `username-change`                                                          | personal details facade `changeUsername`                    |
| Change password                       | inline    | `/account/security`                                                           | `password-change`                                                          | security facade `changePassword`                            |
| Manage notifications                  | dialog    | email row (verified), "Manage notifications"                                  | `email-opt-ins-save:<address>`                                             | email collection facade `writes.saveTopicOptIns`            |
| Turn on two-factor                    | dialog    | `/account/security`, "Enable"                                                 | `twofa-enable`                                                             | security facade `enableTwoFactor`                           |
| Turn off two-factor                   | dialog    | `/account/security`, "Disable"                                                | `twofa-disable`                                                            | security facade `disableTwoFactor`                          |
| Add an IP address                     | dialog    | `/account/security` allowlist, "Add"                                          | `ip-whitelist-create`                                                      | IP whitelist facade `create`                                |
| Edit an IP address                    | dialog    | allowlist row, "Edit"                                                         | `ip-whitelist-save:<id>`                                                   | IP whitelist facade `update`                                |
| Notification preferences              | inline    | `/account/notifications`                                                      | `notification-preferences-save`                                            | notifications facade `savePreferences`                      |
| Billing settings                      | inline    | `/billing/settings`                                                           | `billing-settings-save`                                                    | billing-settings facade `save`                              |
| Top up credit                         | dialog    | `/billing/credit`, "Add credit"                                               | `wallet-topup`                                                             | wallet facade `topUp(currency, amount, paymentDetailId?)`   |
| Product invoice consolidation         | inline    | product billing area (gated)                                                  | `product-consolidation-save:<productId>`                                   | contract-product facade `setConsolidation`                  |
| Product custom label                  | inline    | product settings area                                                         | `product-label-save:<productId>`                                           | contract-product facade `setLabel`                          |
| Product custom label (row tag)        | dialog    | product row's `Ref: <label>` tag, or its "+ Add label" tag on a labelless row | `product-label-save:<productId>`                                           | contract-product facade `setLabel`                          |
| Cancellation request                  | dialog    | product billing area, "Cancellation options"                                  | `product-cancel-request:<productId>`                                       | contract-product facade `requestCancellation`               |
| New ticket                            | inline    | `/support/tickets/new`                                                        | `ticket-create`                                                            | tickets collection facade `create`                          |
| Edit ticket subject                   | dialog    | ticket detail, Manage menu                                                    | `ticket-subject-save:<id>`                                                 | ticket facade `setSubject`                                  |
| Add/change related product            | dialog    | ticket detail, Manage menu (open, unlocked thread)                            | `ticket-set-product:<ticketId>`                                            | ticket facade `setRelatedProduct`                           |
| Invite a delegate                     | dialog    | `/account/delegates`, "Invite"                                                | `delegate-invite`                                                          | delegates collection facade `invite`                        |
| Add/edit a note                       | dialog    | account or product notes panel                                                | `vault-note-create[:<scope>[:<productId>]]` / `vault-note-update:<id>`     | vault facade `create` / `update`                            |
| Add/edit a secret                     | dialog    | account or product secrets panel                                              | `vault-secret-create[:<scope>[:<productId>]]` / `vault-secret-update:<id>` | vault facade `create` / `update`                            |
| Create/edit a referral link           | dialog    | `/account/affiliate` links table                                              | `affiliate-link-create` / `affiliate-link-update:<id>`                     | affiliate facade `createLink` / `updateLink`                |
| Request a withdrawal                  | dialog    | `/account/affiliate`, "Request withdrawal"                                    | `affiliate-withdrawal-request`                                             | affiliate facade `requestWithdrawal`                        |
| Payout destination                    | inline    | `/account/affiliate`                                                          | `affiliate-payout-destination-save`                                        | affiliate facade `savePayoutDestination`                    |
| Switch account                        | dialog    | account menu, "Switch account" (only when there's a choice)                   | `switch-account`                                                           | account facade `switchAccount`                              |
| Change photo                          | dialog    | account card, "Change photo"                                                  | `avatar-save`                                                              | account facade `saveAvatar`                                 |
| Sign out                              | —         | `/logout`                                                                     | `auth-logout`                                                              | auth facade `logout`                                        |
| Notification preferences (token page) | inline    | `/preferences`                                                                | `preferences-save`                                                         | notifications facade `savePreferences`                      |
| Email opt-ins (token page)            | inline    | `/preferences/email/opt-ins`                                                  | `email-opt-ins-save:<address>`                                             | email collection facade `writes.saveTopicOptIns`            |
| Post options                          | dialog    | ticket thread, reply composer's "Post options" control                        | `support-preferences-save`                                                 | personal details facade `saveSupportPreferences`            |
| Pay another amount / use credit       | dialog    | an invoice's Pay control (document or row), where either offers more          | `pay-invoice-amount:<invoiceId>:<paymentDetailId>:<currencyCode>`          | invoice facade `pay(paymentDetailId, currencyCode, tender)` |
| Edit message                          | dialog    | ticket thread, own-message row menu (open thread, undeleted)                  | `ticket-message-edit:<messageId>` (addressed `<ticketId>:<messageId>`)     | ticket facade `editMessage`                                 |
| Brand appearance                      | dialog    | `/account/child-accounts`, "Edit appearance" on the Brand appearance panel    | `parent-branding-save`                                                     | account facade `saveParentBranding`                         |
| Share this invoice                    | dialog    | invoice document, "Share"                                                     | `invoice-share-save:<id>`                                                  | invoice facade `saveShare`                                  |

The Post options form asks two questions: which key starts a new line (Enter
or Shift+Enter) and whether the other key still sends a reply. Both open on
the brand's own enter-key setting; leaving the key unanswered on save keeps
whichever one was already in force.

The new-ticket form also carries a "Schedule for later" date-time field, but only
where the brand has switched scheduling on — a brand without it has no field to leave
empty, exactly as legacy showed it nowhere else. A date-time entered there that is
still ahead when the form submits opens the ticket `SCHEDULED` rather than `OPEN`; one
already in the past is refused rather than silently opening the thread now.

The share dialog carries two further controls beside Save and Cancel, riding the
`extraActions` channel above: **Regenerate link** opens the shell's confirmation
dialog first — the link already handed out stops working the moment the confirmation
is accepted — then mints a fresh token; **Copy link** copies the current link and
closes nothing. Both dispatch their own verb directly rather than going through the
form's own submit. The dialog itself never opens on a delegated invoice:
`open-form:invoice-share:<id>` is asked the same guard the write would refuse by,
before any dialog is offered (see `architecture.md`'s form-door guard table).

## Row actions and other write paths beyond the form registry

Not every write goes through the form registry above. Confirmed working:

- **A dashboard product row's own button** leads with the provider's highlighted
  provisioning action where one is published, falling back to a generic manage action;
  its overflow menu lists every provisioning action, then a manage action and a
  "Manage billing" shortcut. There is no separate "view details" entry — the row's own
  action and the manage action in the overflow cover it.
- **The invoices list offers to consolidate**, above the listing, when the brand runs
  consolidation, leaves it to the client rather than reserving it to staff, and there
  are at least two eligible unpaid invoices — a recurring demand, untouched, with no
  payment already in flight, in one currency. Accepting the confirmation raises one new
  unpaid invoice for the combined total and cancels the originals.
- **A pending invoice waiting on a payment already with the gateway** offers a "View
  payment instructions" action wherever the gateway published something for the client
  to do; it opens a read-only dialog rendering that text and asks nothing back.
- **An unverified stored payment method offers "Retry verification"** on its row menu,
  asking the gateway to confirm the card again. It is greyed out, with a reason, on a
  card the gateway will not attempt twice — the same guard the write itself refuses on.
- **Paying an invoice can offer a choice of currency, not just its own.** Where the
  brand allows settling in a currency other than the one an invoice was raised in, the
  document's own Pay control and its row's Pay button and menu all open the same
  currency choice: the client's preferred payment currency first (where the brand
  quotes a rate for it), then the invoice's own currency, then every other currency the
  brand publishes a rate for. A currency the brand does not quote is never offered, and
  choosing one the brand stops quoting between load and submit is refused before any
  confirmation opens rather than silently settling the invoice in its own currency
  instead. The confirmation always names the amount actually being charged, in the
  currency chosen, and the card it will be taken from; the receipt afterwards names the
  same settled amount, not the invoice's own total.
- **The same Pay controls carry a second entry beside the currency choice**, opening
  the Pay another amount / use credit dialog above: "Pay another amount" where the
  brand takes less than the full balance, "Use account credit" where the account holds
  a balance in the currency being paid, or "Change amount or use credit" where both
  apply. Neither the entry nor the field it opens appears where the brand and the
  account offer nothing to change.
- **That same dialog's "Pay with" field adds "A new card" beside the stored ones.**
  Choosing it reveals the card-entry fields (the same fields the add-card dialog uses)
  and a "Save payment details" box underneath. Paying with an unsaved card checks it
  the same way the add form does and never stores it; paying with a saved one stores
  the card first and then follows the add form's own auto-payment rule — on by
  default, off where the client turns it off, always on and locked where the brand
  forces automatic settlement. The account's default card leads the "Pay with" list
  where the account holds one; an account with no stored card opens straight on the
  new-card entry, since that is the only way it can pay at all.
- **A brand that forces card storage removes the choice from this dialog too.** Where
  the brand's own key forces every stored card to stay on file, the "Save payment
  details" box is left off the new-card entry entirely and the card is kept whatever the
  client would otherwise have chosen — the same rule the add-card dialog already
  followed, applied here as well; the add-card dialog itself is unchanged, since storing
  the card is already the whole point of that form.
- **An order's own Pay control is the same door as its unpaid invoice's.** The order
  page offers Pay beside Cancel while an invoice is still owed and the brand has a
  published gateway; the currency, amount and credit choices it opens are the invoice's
  own, unchanged.
- **A ticket message the persona wrote offers Delete and Remove attachment** on its row
  menu, alongside Edit, while its thread is open; deleting replaces the body with a
  notice and offers only "View deleted message" afterwards, which opens the original
  body in a read-only dialog.
- **The wallet page lists credit statements as documents**, one per period, each with a
  "Download PDF" (the print view) and a "Download CSV" action, shown wherever the
  account carries a credit-limit allowance.
- **A vault note or secret can be pinned to the top of its panel, or let back down**,
  from its own row menu; both the account and the product panels open with pinned rows
  first, then the order they already held. The one guard the whole vault panel carries —
  an account still being imported — refuses a pin the same way it refuses everything else
  there. Each row also names who wrote it and when, and who last edited it, once either
  fact is on file.
- **Credit notes gain a toolbar**, on the account page and on a product's own credit-note
  panel alike: a free-text search (by number), an amount band, Allocated or Unallocated,
  an issued-date range, and four sorters (newest, oldest, largest first, by credit-note
  number).
- **Affiliate links become a searchable, sortable collection** — by name or redirect URL,
  opening on newest as every other listing here does, with most-visits and
  most-referrals beside it — and commissions and payouts each gain a date-range filter
  (payouts read the date a payout actually settled, not when it was requested) and an
  amount sort alongside their date sorts.
- **A new referral link opens with its redirect field already filled** from the brand's
  own default redirect address, where the brand publishes one; a brand that publishes
  none leaves the field empty. The field states that the link must land on one of the
  brand's own domains, on every brand, but the one rule it enforces is that it isn't
  left blank — nothing here checks the address against a domain.
- **The delegates panel gains a toolbar** — search by name or invite email, Accepted or
  Pending, Full access or Specific, alongside the existing access-type control — and
  sorts by recently invited (the panel's own opening order), full access first, or
  accepted first; every row states the date it was invited.
- **The sign-in log gains a toolbar** — search by part of an IP address — alongside its
  existing outcome and date-window filters, and sorts newest first, by address, or by
  outcome.
- **The support tickets panel gains a created-date range** beside its existing
  department and status filters, narrowing to when a ticket was first raised.
- **A product's own Tickets tab gains the same toolbar the main support listing has** —
  search by reference, subject or department, plus department, status and a
  created-date range, all narrowed to that product's own threads.
- **A delegate's detail page gains a toolbar on each of its two grant panels** — the
  granted-products panel searches by name, category or service identifier and sorts by
  name or newest; the granted-tickets panel searches by reference, subject or
  department and sorts by newest or subject.
- **The child-accounts panel gains a toolbar** — search by name or email, an
  inherit-payment-details filter beside the existing "Log in as" filter, and an
  added-date range — and sorts by name or by the day the relation was added.
- **The email log gains a created-date range**, narrowing the sent/failed/bounced tabs
  to when a message actually went out.
- **Affiliate links gain a filter band to go with their sorts** — a created-date range,
  a visit-count band and a referral-count band, alongside the existing search and the
  newest/most-visits/most-referrals sorts.
- **A migration option offers to read more before it is chosen.** Each row in the
  change-to picker states the option's own short description and its price in the
  brand's own quoting style; "Review changes" beside "Change to this" opens the
  option's full description in the shell's read-only prose dialog — a read, with
  nothing to submit — so a client can see what the change buys before committing to it.
- **An invoice states which stored card will settle it.** A payable, non-delegated
  document reads "Selected payment method: `<card>`" with a "Change" action, or "No
  payment method selected." with a "Select" action where no card is chosen; either opens
  the change/select payment method dialog above, and every Pay control on that document
  then honours the card it names. The message and its action both disappear once the
  invoice is settled, delegated, or carrying a payment that is still clearing.
- **Three further gates govern controls already described above.** A brand can switch
  off the affiliate withdrawal-request action entirely, refusing the request before its
  confirmation opens even where a balance is available. A brand can keep a client from
  removing their last remaining stored payment method — the default card is always
  protected regardless of this gate, so this only widens the protection to a lone
  non-default card. A brand can force automatic settlement on every stored card: the
  auto-pay switch on a payment-method row then reads on and cannot be switched off, with
  a reason given for why.
- **A product's own billing details panel opens the account's Add company dialog too.**
  Beside its address list, the panel offers every company the client is invoiced as, each
  switchable with its own row action; its own "Add new company details" row opens the
  "Add company" door, which names client-vue's company form (`client-vue-adoption.md`), rather than a form of
  its own — one form, reached from two places.

## Go-real seam

Every schema module above — real or stand-in, local or none — is written to the same
shape a future real headless module would expose: a `useSchema()`/`useUischema()` pair
plus a write method on the entity's contract. Swapping a mock form for the real thing is
a source change inside the manager the registry calls, never a change to the form
module, the registry shape, or the page composition around it.
