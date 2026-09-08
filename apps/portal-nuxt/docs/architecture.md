# Mock architecture

> Six families are client-vue's, not this mock's: their routes render a "Provided by
> client-vue" stub — `docs/client-vue-adoption.md` lists what mounts there.

This is the mock data layer under `app/portal/mock/` — how one page renders live data
with no API behind it, in depth. Read `../README.md` first for the one-screen version.

## The store: one reactive dataset per brand

`mock/store.ts` holds a `MockDataset` per shipped brand id (`MOCK_DATASET_ID`). The
first read of a dataset deep-clones its frozen seed module (`hostgrid.ts` /
`hostgrid-minimal.ts`) into a `reactive()` object and caches it; every later call
returns the same object, so every consumer shares one source of truth for the session.
`resetMockData(id)` drops the cached object — a test seam, and what makes a page reload
start from a clean seed again.

Created rows draw ids from a namespace no seed uses (`<prefix>-new-<n>`, via
`nextId`/`mockId`), so a row minted during a session can never collide with a seeded
one, even after a reset restarts the sequence at 1.

## Gates: brand facts as data

`mock/gates.ts` (`useMockBrandGates`) derives the active dataset's feature flags,
navigation-affecting facts (whether the client is a parent, or is itself a child), and
brand-authored copy (footer, login/register markdown) from `dataset.features`. Most of
those flags are typed as a subset of the real platform's own configuration keys, so a
flag can't drift from what it's meant to model; a small number are declared locally
because the real platform has no equivalent (an external storefront URL, whether
one-time purchases are hidden, whether wallet top-up/registration-password/reCAPTCHA
are on, an org-registration context flag). The primary navigation is built from these
flags rather than hardcoded, so both the "everything on" and "everything off" datasets
render a different, correct nav.

A handful of these gates are worth naming individually — each is a real member of the
platform's own configuration keys, not a locally-declared stand-in:

| Flag                                         | Underlying configuration key                                   | Governs                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED` | `billing.payment_currencies.enable_different_currency_payment` | Whether an invoice's Pay control offers a choice of settlement currency at all                                |
| `BILLING_GATEWAY_FORCE_AUTO_PAYMENT`         | `billing.gateway.force_auto_payment_for_stored_details`        | Whether every stored card settles automatically, with the row's own switch locked on                          |
| `PREVENT_CARD_REMOVAL_IF_LAST`               | `billing.gateway.allow_card_removal_replacement`               | Whether a client's last remaining stored card refuses removal (the default card is always protected)          |
| `CLIENT_TICKET_SCHEDULING_ENABLED`           | `tickets.tickets.client_can_schedule`                          | Whether the new-ticket form carries a "Schedule for later" field at all                                       |
| `AFFILIATES_WITHDRAW_REQUEST`                | `affiliate_systems.settings.withdraw_request`                  | Whether the affiliate withdrawal-request action is offered at all                                             |
| `UI_ENTER_KEY_ACTION`                        | `ui.client_area.enter_key_action`                              | Which key sends a ticket reply and which starts a new line, until the client's own Post options say otherwise |
| `PARTIAL_PAYMENTS_ENABLED`                   | `billing.gateway.client_allow_partial_payments`                | Whether a Pay dialog offers an amount field at all, letting a client settle less than the full balance        |
| `TAX_NUMBER_VALIDATION_ENABLED`              | `price_tax.tax.enable_automatic_vat_validation`                | Whether a company's tax number carries a "validated" tag (validating one stays a staff-only action)           |
| `UI_PARENT_BRANDING_ENABLED`                 | `ui.client_area.allow_parent_client_branding`                  | Whether a parent account is offered the parent-branding panel at all                                          |
| `UI_LOGO_URL`                                | `ui.client_area.logo_url`                                      | Whether the header mark is an external anchor to the brand's own logo, or the internal home link              |
| `AFFILIATES_DEFAULT_REDIRECT_LINK`           | `affiliate_systems.settings.default_redirect`                  | What a new referral link's redirect field opens already filled with, where the brand publishes one            |
| `INVOICE_CONSOLIDATION_BASE_RULE`            | `invoices.consolidation.base_rule`                             | Which day-rule the brand's own consolidation schedule runs on, named on the form's inherit option             |
| `INVOICE_CONSOLIDATION_WEEK_DAY`             | `invoices.consolidation.base_rule_day_of_week`                 | Which weekday the brand's schedule names, read only where the base rule is a day-of-week rule                 |
| `INVOICE_CONSOLIDATION_DATE`                 | `invoices.consolidation.base_rule_date_of_month_day`           | Which day of the month the brand's schedule names, read only where the base rule is a day-of-month rule       |
| `PRICE_DISPLAY_TYPE`                         | `invoices.common.display_price_type`                           | Whether a migration option's price and its order in the change-to picker follow the cheapest monthly figure   |

`PREVENT_CARD_REMOVAL_IF_LAST`'s own key reads as an "allow", not a "prevent" — see
`gotchas.md`.

## Managers: the mock twin of a platform composable

Every mutable entity (an invoice, a ticket, a payment method, a delegate…) is read and
written through a manager with the same four-layer shape the platform's own composables
return:

- `useContext()` — the resolved record (or, for the paged-collection generic in
  `collections.ts`, the current page slice) as a `data` ref, plus an always-empty
  `error` ref.
- `useMeta()` — `isLoading`/`hasError` (always false — nothing here really loads),
  `isEmpty`, `isAvailable`.
- `useActions()` — the entity's write methods, plus `refresh`/`invalidate`/`isReady`
  (all resolve immediately) and `destroy` (drops this instance so the next call
  re-mints it).
- `useInternals()` — always `{ query: undefined }`. A mock has no real query object to
  hand back, and nothing in this app reads it.

`mock/facades/facade.ts` provides the generic that builds this shape
(`defineMockFacade`) over a registry keyed by `(dataset, key)` — a `WeakMap` on the
dataset object nested with a `Map` on the key, so `resetMockData` (a new dataset object)
clears every manager's cached instances for free, and a manager scoped per-entity
(`useMockInvoice(data, id)`) or per-context (a delegate list scoped to one product) never
leaks state across keys. `mock/collections.ts` is the paged-list sibling of the same
idea, with pagination math (`limit`/`total`/`page`/`pages`/`from`/`to`) that mirrors the
platform's own list-query contract: the page index is the only state a collection owns,
every other field derives from the live array on each read, and it clamps rather than
throws when the total shrinks under the current page. `mock/collection-defs.ts` declares
one of these per paged panel — its source array, any preset narrowing, and its runtime
filters — keyed by a ref id plus a context discriminator where one ref id serves more
than one page (so page 2 of one listing never bleeds into a sibling that reuses the same
underlying array).

`mock/ledger.ts` is a deliberate leaf: it derives the wallet's running balance by
chaining every movement, per currency, back from the balance the account actually
holds — a seeded movement records what moved, never what the balance stood at
afterwards, because padding movements land between hand-authored ones and any
authored balance would stop matching the moment they did. It stays a leaf on
purpose: `mock/collection-defs.ts` cannot import the facade barrel to reach it,
because that import opens a module-load cycle through the store and the seeds
(`Cannot access 'SEED_CURRENCY' before initialization`) — the collection instead pairs
its paged rows with the facade's own view of each one, and the facade is where
`mock/ledger.ts` gets read.

The client credit page no longer lists the wallet-movement ledger itself as a paged
panel — legacy reserves that listing to staff, and the client-facing collection was
withdrawn as an over-build. `mock/ledger.ts`'s derivation stays exactly as it was: the
credit-statements panel is its one remaining reader, so a statement's own figures still
come from the same chained balance the ledger always computed, even though nothing on
the client page pages through the movements one at a time any more.

`mock/vault-order.ts` is the same shape of leaf for the vault panels: its one export,
`pinnedFirst`, orders a row list with pinned rows first and the rest in the order they
already held — legacy left this to the server (`vaultProvider.vue:164` drops the sort
from its own query so the back end can put pinned rows on top), so here it is the one
function every reader of vault rows calls rather than the facade that writes the pin.
`collection-defs.ts` calls it directly for the account's own notes and secrets panels,
and `selectors.ts` calls it for a product's own vault rows, for the same reason
`collection-defs.ts` cannot reach `ledger.ts` through the facade barrel.

`mock/dates.ts` is the same shape of leaf again, smaller: `today()` is the one ISO
`YYYY-MM-DD` stamp every seed and every write reads, because five facades had each
authored their own copy of it — two of them spelled differently — and a seed's day and a
write's day have to share the exact same shape, or a row written today sorts against
rows seeded yesterday in the wrong order.

`mock/forms/twofa-enrolment.ts` sits beside its stand-in for a related but distinct
reason: `contracts/auth.schemas.twofa.ts` is kept transcribed export-for-export from the
real headless module (see `forms.md`), so a widening the stand-in itself does not
declare — the setup key and the `otpauth://` link stated above the code box — lives in
its own module rather than inside the file it widens. Only the enable dialog reads the
widened pair; the disable dialog and the stand-in's own conformance test still read the
stand-in whole.

## Writes answer with a receipt, never a message

A manager's write method never renders anything — it returns a `MockActionReceipt`:
`{ ok, reason?, entity? }`. `reason` is a code from a closed catalogue
(`MOCK_RECEIPT_REASON` in `mock/facades/facade.ts` — `already-paid`, `last-method`,
`not-cancellable`, `duplicate-contact`, …), not a sentence. Turning a receipt into a
sentence is the dispatcher's job alone, so a manager never has an opinion about wording
and the same refusal always reads the same way wherever it's hit.

## The dispatcher and the verb grammar

Every module emits `select` with a plain string: `<verb>` or `<verb>:<id>`, where `<id>`
may itself carry a JSON tail (a form submit) or further colons (a reply's free text,
which is why only the _first_ colon splits the verb from its payload). `mock/actions.ts`
`dispatchMockAction(dataset, routeContext, value)` is the one place that string is
read: it resolves the right manager, calls the right method, and returns a
`MockActionResult`:

| Field      | Meaning                                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to`       | Navigate here after the mutation.                                                                                                                                                                                                                                 |
| `href`     | Open this in a new tab — an external destination (a provider's own panel); never routed to.                                                                                                                                                                       |
| `toast`    | `{ intent, title, description? }` — raised through the shared `Toaster`.                                                                                                                                                                                          |
| `confirm`  | `{ title, description, actionLabel, destructive?, then }` — opens the shell's one confirmation dialog; accepting it re-dispatches `then` through this same door.                                                                                                  |
| `form`     | `{ id, entityId? }` — opens the shell's one form dialog on a registered form (see `forms.md`).                                                                                                                                                                    |
| `prose`    | `{ title, markdown }` — something to READ, with nothing to submit (payment instructions, and anything else a brand or provider writes for the client). Opens the shell's one prose dialog; closing it is the only way out.                                        |
| `formDone` | The submit that just answered was a form's, and its receipt was `ok` — the shell closes the open form dialog on this, not on the toast, so a submit that navigates or answers silently still closes it, and a refusal leaves the dialog open with what was typed. |

`composables/useMockActionRunner.ts` is the runner every `select` emit goes through
(`shell/PortalSlotContent.vue`, plus the impersonation ribbon's "end" control, which
sits outside the module system). It applies a result in a fixed order: close an
answered form, raise the toast, open the confirmation (wiring its accepted re-dispatch
back through itself), open the form dialog, open the prose dialog, open an external
`href`, then navigate.

Destructive verbs that can be refused (an order that can no longer be cancelled, a
ticket that is locked) check the refusal _before_ opening their confirmation, so a
client is never asked a question that would then refuse — the refusal fires immediately
instead.

Two verb tiers, by design: an unrecognised verb is a silent no-op (chrome controls emit
values this layer never authored — that's fine, it isn't this layer's business), while a
_recognised_ verb naming a row the active dataset doesn't hold always answers out loud
(a `not-found` toast) — a control the client actually pressed never does nothing.

## Collections: pagination, filters, sort, search, page size

A paged panel's pager, filters and sort/search controls all reach the _same_ collection
instance through the verb grammar (`page-next`/`page-prev`, `collection-filter:<id>:<key>:<value>`,
`collection-sort:<id>:<tail>`, `collection-search:<id>:<tail>`, `set-page-size:<id>:<n>`).
Filters are declared per collection from a small kit (`mock/collection-filters.ts`) —
date-range, select, toggle-group — each control's key is exactly the key the collection's
own typed filter map reads. The page index survives a filter or sort change (it does not
reset), matching the platform's own behaviour; it only clamps when the total shrinks
under it. `set-view` (grid/table) is a display preference, not collection state — it is
stored in `localStorage` beside the theme and dataset choice, read by
`composables/useListViewPreference.ts`.

A per-tab filter band is not hand-tuned per tab: `presentControls` drops any control
the tab's own showing rows offer no choice in, and keeps it otherwise. The invoice
tabs' status control rides this one rule — a tab holding a single status renders no
status control, while the Unpaid and Credited tabs (two statuses each) both render
one. The Credited tab's own extra date-range control (`dateCancelled`, legacy's own
Credited filter) is the one addition still authored explicitly, since no other tab can
answer that question at all.

The IP allowlist (`ipWhitelistCollection`) registers as a paged, searchable collection
(`PAGED_COLLECTION_ID.IP_WHITELIST`) exactly like every other listing here — before
this it existed only as a plain array in `collection-defs.ts`, reachable by neither a
pager nor its own search band. Its seed pads to the standard three-page target
(`padTo`, `SEED_ROWS_PER_LIST = 24`) the same way every other padded listing does, so
its pager always has a middle page to land on.

## Filter seams

A collection definition publishes two things over the same runtime state: a `source`
predicate that narrows the rows a panel actually holds, and a named filter map
(`mock/contracts/*.ts`) a future real module would call the same way. The rule that
binds them: **every named setter in every collection narrows the rows it names, and
each contract's filter map carries exactly legacy's own client-facing filter set** —
neither a wider map (a setter with nowhere to write) nor a narrower one (a filter
legacy published that the map drops) is correct.

`mock/collection-filters.ts` is the one place a predicate is written, so eight
listings ask the same question the same way:

| Predicate                                           | Reads                                                  | Asks                                                   |
| --------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| `matchesExact`                                      | An exact value                                         | Does the row equal what was asked for                  |
| `matchesContains`                                   | A substring, case-insensitively                        | Does the row's text contain what was asked for         |
| `matchesFlag`                                       | A boolean or a band's `"yes"`/`"no"`, via `wantedFlag` | Does the row's own boolean agree, from either spelling |
| `matchesAny`                                        | A value against a row's own SET                        | Does the row's set hold what was asked for             |
| `matchesAmountBand` / `matchesCountBand`            | An authored band's `value`                             | Does the row's figure fall inside that band's range    |
| `matchesDateRange` / `matchesFrom` / `matchesUntil` | An ISO day or a range                                  | Is the row's date inside the window                    |

`wantedFlag` exists because a flag narrowing is written from two different sides that
spell the same fact differently: the band's own control writes its option's value
(`"yes"`/`"no"`), while a module's named setter writes the contract's own boolean
(`filters.successful(true)`). A matcher that only understood the band's spelling left
every published setter silently inert — the setter ran, `apply` wrote the criteria key,
and the panel never narrowed.

Proving a seam this way means calling every named setter and checking that the rows
narrow, on both datasets, not just that the setter compiles against its contract's
type. A setter that never reaches a predicate at all — a filter map entry omitted from
the `source` closure — passes every type check and narrows nothing.

## Truncation: document lines and notification bodies

The document module (`modules/document/Document.vue`) takes an optional `lineCap`. A
document past the cap collapses behind a "Show N more items" control, but only where
collapsing actually hides more than one row — a document one line over the cap still
renders whole, because hiding a single row to show a control asking to reveal it back
is not worth it. The print variant of the same module is never given a cap, so a
printed document always renders every line. A notification body follows the same
shape at a fixed 150 characters: cut on the last space at or before the limit (never
mid-word) behind its own "Read more", with the full body reachable from the same
control.

The same module's `paidStamp` prop is the word stamped across a settled document's
amount-due block. It is fed only where the underlying invoice is PAID and not still
clearing — a refunded or cancelled document, which is neither owed nor paid, wears no
stamp either, because it was unwound rather than settled.

## Ticket thread: the feed and its page

A thread's feed (`selectors.ts`'s `ticketFeed`) interleaves two kinds of entry by when
each happened: every message, and every time the status log recorded the standing
moving to a new value ("Status changed to `<label>`"). A status entry sits between two
messages exactly where it happened, so it can break an unbroken run of one author's
own messages apart the way it would in the real conversation. A ticket born already in
a given status (a scheduled one, for one) carries no entry for that starting state —
only a later close or reopen appends one.

The thread opens on its own latest twenty entries (`TICKET_THREAD_PAGE`), not the
oldest — legacy loaded a conversation from its newest end and fetched further back
behind it. Each page still reads oldest-first within itself, because a conversation
reads downwards; asking for more simply takes a larger slice off the same end
(`?page=2` takes forty, `?page=3` sixty, and so on) rather than paging forwards through
older material. A thread with twenty entries or fewer has nothing more to fetch.

A ticket's own standing sentence (`ticketStatusMessage`) reads one line per status code —
six, one each for open, client-replied, in progress, awaiting response, scheduled and
closed — dated on `scheduledAt` for a scheduled thread (falling back to `updatedAt` where
none is on file) and on `updatedAt` for every other status.

## Data refs: the seam between a page's static config and the live store

A page's composition (`app/portal/config/*.ts`) is a plain data structure — it can't
import the store. Where a prop needs live data, the config carries `dataRef(id)`
instead of a literal. `shell/PortalSlotContent.vue` is the one place that matters: its
computed calls `resolveDataRefProps` on every module's resolved props, which looks up
the ref's selector (`mock/selectors.ts`) against the currently injected dataset and
route context and substitutes the result. A module itself never sees a ref — only the
selector's output — so the render-only rule (a module renders what it is given) holds
even though the data behind it is live and mutable.

`mock/injection.ts` provides the active dataset and `mock/detail.ts`/route-context
computeds down through `provide`/`inject`, set up by the layout and the page host — a
bare unit-mounted module has no provider and sees "no dataset", so its literal props
still render exactly as authored.

## The shell: three dialogs, one door each

- `shell/PortalConfirmDialog.vue` — the app's only `AlertDialog`. Held by
  `composables/useConfirmDialog.ts`: `request()` opens it and remembers which verb to
  re-dispatch on accept; `accept()` runs that verb back through the caller that raised
  it, so the accepted half is indistinguishable from any other emit.
- `shell/PortalFormDialog.vue` — the app's only form dialog, mounting the `form` module
  bound to whichever registry entry `useFormDialog.ts`'s `pending` names. See
  `forms.md` for the form module itself and the registry.
- `shell/PortalProseDialog.vue` — the app's only read-only dialog. Held by
  `composables/useProseDialog.ts`: `open()` hands it one piece of authored markdown, and
  closing is the only way out — it asks nothing back, so there is no accepted half to
  re-dispatch.

## Route context and the module registry

`app/portal/routes.ts` resolves the catch-all's path segments against the active
brand's configured product groups and custom pages — a pure function, tested in
isolation, that the catch-all page is the only caller of. `PortalSlotContent` renders
one resolved slot from a page's composition: either a module (its registered component,
fed its resolved props) or a group, which recurses over its own members on a shared
layout axis and may wear a section wrapper with its own heading. A slot that fails to
resolve renders nothing in production and logs its reason to the console in
development only.

`DataRouteContext` (`mock/injection.ts`) splits into two kinds of member: the ones a route
carries in its own path (`groupSlug`, `productId`, `area`, `entityId`, `pillar` — supplied
by a resolution, never a query string), and every other member, which is query-borne.
`ROUTE_QUERY_KEY` is a typed record naming the query key each query-borne member reads;
adding a member to `DataRouteContext` without adding it there too — and deciding which of
the two kinds it is — fails the build, so a member cannot be declared and left silently
unthreaded. `routeQueryContext(query)` builds the query-borne half by iterating
`ROUTE_QUERY_KEY` rather than reading each member out by name; `queryFilters()` on the
catch-all page (`app/pages/[...slug].vue`) is one call of it, and the token-page
`opt-ins` screen — which used to hand-roll its own second copy naming only `token` and
`email` — is the other, so both pages read the same pair the same way. `routeQueryValue`
treats an empty string the same as an absent key (`?token=` with nothing after it reads
as no token at all), which is what every reader of these members expects.

Every `ModuleRef`'s own `props` (`types.ts`) is typed as `Readonly<Record<string,
unknown>>`, and the registry's own `component` (`registry.ts`) is typed as a bare Vue
`Component` — a page config can hand a module props it never asked for, or leave one out
that it needs, and both still typecheck clean; nothing short of running the page catches
it. Narrowing each registration to its own module's declared prop type would close this,
but is not a small change: a `moduleRef` may hand a prop a live `dataRef(...)` marker
rather than a literal value, which most of this app's own props bags do (101 of 128, at
last count), so the narrowing needs a generic threaded through the resolver and every
module's own prop type, not a local annotation — left as follow-up work, not attempted
here.

## The order's own standing

An order derives one of seven standings (paid, pending payment, payment failed,
partly paid, not paid with no gateway, not paid, cancelled) in a fixed order: a
cancelled order is asked first, reading the order's own status rather than its
invoices, and every other question is asked against the invoice ledger; paid needs at
least one invoice and every invoice settled. An order that answers none of the seven
— a live order with nothing raised against it yet — carries no message at all, on both
datasets and in the built app.

## The product condition banner

A product's own condition banner (`productCondition` in `selectors.ts`) reads one of
fourteen states, asked in a fixed order — whatever the client can act on first, then
whatever only reports where the product stands:

| Title                       | Tone    | Fires when                                                                                   |
| --------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Waiting for payment         | warning | Pending the order it was bought on                                                           |
| Awaiting activation         | info    | Awaiting activation, with nothing left for the client to fill in                             |
| Setup is waiting on you     | warning | Awaiting activation, with setup fields still open                                            |
| Suspended                   | danger  | Suspended for an unpaid invoice                                                              |
| Scheduled for cancellation  | warning | A lodged, unaccepted request is the future-dated kind, and carries a day                     |
| Cancellation requested      | warning | A request is lodged and unaccepted, and either isn't the future-dated kind or has no day yet |
| Scheduled to cancel         | warning | An auto-expiry date is set                                                                   |
| Ends at the end of the term | warning | Active, a subscription, auto-renew off, with a next due date                                 |
| Cancelled                   | neutral | Cancelled                                                                                    |
| Lapsed                      | neutral | Closed                                                                                       |
| On trial                    | info    | A trial still ahead of its own end date                                                      |
| An invoice is still owed    | warning | Any unpaid invoice raised against the product                                                |
| Active (fulfilled)          | success | A one-time purchase, active                                                                  |
| Active (renewing)           | success | A subscription, active, auto-renew on, with a next due date                                  |

A product matching none of the fourteen still draws a banner: a bare "Active — This
product is running." is the floor every remaining product lands on, so a product a
client opens never renders with no banner at all.

The "Scheduled for cancellation" / "Cancellation requested" pair share one fact rather
than duplicating it: `lodgedCancellationLine` names the day the request takes effect only
where the request actually carries one, and states just the day it was asked otherwise — a
future-dated request lodged before its own effective day is loaded falls through to the
plain "requested" reading rather than naming a day it doesn't have yet.

This is a different notice from the billing tab's own "An invoice is still owed" banner
(`PRODUCT_HAS_UNPAID_INVOICES`), which only shows on an auto-renewing product and tones
itself louder — danger rather than warning — where the product is suspended or any unpaid
invoice on it has already fallen due (`productUnpaidInvoiceTone`); the two can both be
true of the same product, saying the same thing from two different tabs.

## The delegate invitation link's own page

`/delegate-access/accept/[hash]` (legacy's `acceptInviteModal`) reads its hash as a path
segment and hands it to the page host as `context.token` — the same context member every
other link-borne screen reads, not one of its own. Its one banner
(`delegateInviteReading`) draws one of three readings: no token yet (or an empty one)
reads as still verifying; a hash matching no seeded invite, or one already marked
expired, reads as spent, with a CTA back to the dashboard; a live invite reads as
accepted, naming the product it grants where it names one product
(`DelegateObjectTypes.CONTRACT_PRODUCT`) or the count of products a whole-account invite
grants otherwise, either way linking on to what was just opened up.

## The product's lifecycle timeline

The billing tab's timeline (`modules/timeline`, over `@upmind/ui`'s `Timeline`) draws
two kinds of row on one rail: the desk's own scheduled actions, and a set of lifecycle
events `productLifecycleEvents` (`useMockContractProduct.ts`) derives from the product's
own dates and its invoices, rather than storing them as rows of their own. At most one
of each applies: a renewal reading (or, where auto-renew is off, a "Next invoice"
reading naming the day it will be raised, linking the product's own billing area so a
client can raise it early); a payment reading naming and linking whichever invoice is
still owed, worded as overdue once its due date has passed; and one lifecycle-stop
reading — suspended, cancelled, or terminating — chosen by whichever of those facts the
product actually carries, never more than one at a time.

Every event reads its date relative to today (`relativeReading`) — "today", "tomorrow",
"in 6 days", "3 days ago" — falling back to a bare calendar day where the underlying
value carries a full timestamp a relative reading has no way to honour, and stating no
day at all where the product carries none (a suspension recorded with no date says only
that the product is suspended, rather than borrowing the day it was bought). An event
that has already passed reads with a warning tone; one still ahead reads as information.
The rail sorts its dated rows by date and lets its undated ones follow, in that fixed
order, rather than interleaving a dateless row wherever it happens to fall.

`productHasTimeline` — the flag the page gates the whole rail on — asks the exact same
derivation `productTimelineItems` renders, rather than a narrower proxy: a one-time
purchase has nothing to schedule, and a trial still counting down to its own expiry says
so in its own banner instead, but every other subscription draws the rail whenever it
derives at least one row, whether that row came from a scheduled action or from the
product's own dates.

## Billing details: address and company, one grid

A product's Settings tab pairs two lists in one panel ("Billing details" in
`product-pages.ts`): every address the client keeps (`productAddressItems`) beside every
company the client is invoiced as (`productCompanyItems`), each row tagging the one
currently in use and offering to switch to any other — two doors onto
`SET_PRODUCT_BILLING_ADDRESS` and `SET_PRODUCT_BILLING_COMPANY`. Each list ends with its
own door to add another: the address door leaves for the profile's own address book,
since that is where an address is created; the company door opens the same
"Add company" door, a client-vue stub (see `client-vue-adoption.md`), without leaving the page.

## Invoice payability and the clearing state

Owed and payable are two different facts once a payment can be recorded without having
actually arrived. `isInvoiceOwed` is legacy's own unpaid-status test; `isInvoicePayable`
(`useMockInvoice.ts`) narrows it to `isInvoiceOwed(invoice) && !isInvoiceClearing(invoice)`,
and it is the one fact every reader that offers or accepts a payment defers to — the
document's own controls, a list row's Pay button and menu, the pay-amount form builder,
and the write itself. `isPartlyPaid` and the invoice-consolidation gathering still read
the wider `isInvoiceOwed`, because a document already clearing is neither owed-and-open
nor owed-and-idle in the way either of those cares about.

`isInvoiceClearing` is legacy's `isClearing` (`invoiceProvider.vue:91-95`): a payment
already recorded against the invoice through an OFFLINE gateway, still `PENDING`. Legacy
modelled the same state as a PAID document carrying a pending payment method; this app
keeps the invoice's own status in its unpaid group instead (the one seeded example is
`OVERDUE`) and hangs the fact off the pending payment, so a clearing invoice is read by
asking its payments, never its status. While it holds, the payments panel, the
payment-method message and every Pay control disappear from the document
(`invoiceDocumentPayments`, `invoiceMethodMessage`).

`whyNotPayable` is the one guard every Pay path asks, in legacy's own order: a settled
document first, then one already clearing, then a currency the brand publishes no rate
for. `whyNotMethodChangeable` shares its clearing branch — legacy drew its whole
payment-method message on `isPayable`, so a clearing document states no method and
offers neither Change nor Select — plus its own delegated-invoice branch, since a
delegated account never owns the choice of card.

## Credit at pay time: what an account may draw on

An account's spendable credit (`useMockInvoice.ts`) is `creditAvailable = held +
remaining allowance`: the balance it already holds, plus whatever is left of its
credit-limit allowance (`allowance.amount - used.amount`, floored at zero, and only
where the limit is held in the same currency being paid). `used` is the amount already
drawn against the allowance, not the allowance itself — the remaining figure is what
is left to draw. A pay dialog's own credit line reads one of the three sentences
legacy read: both figures where the account holds both a balance and a remaining
allowance, the balance alone, or the remaining allowance alone; an account with
neither is offered no credit line at all. The cap a payment may actually draw is the
smallest of what was asked for, what is being settled, and this same available
figure — so the bound the form offers a client and the bound the write enforces are
never two different numbers.

## Invoice standing: what the document reads, what a row reads

Two functions answer two different questions about the same document
(`useMockInvoice.ts`). `invoiceStandingMessage` is what the document itself renders —
one of six states derived from `invoice.status` (unpaid, overdue, cancelled, refunded,
paid, each with the wording a proforma takes instead), with the cancellation reason
appended on the cancelled branch alone. It never reads `invoice.toBeCredited` at all.
`invoiceRowStanding` is the compact reading a list row takes instead: it reads
`toBeCredited` first, but only where the document is still owed (`isInvoiceOwed`), and
falls back to the same status label/tone the document derives from otherwise. This
mirrors legacy's own signature exactly — `InvoiceStatusMap(invoice, showToBeCredited =
false)` — whose document banner passes the default `false` and whose row and order-row
callers alone pass `true`. So a to-be-credited invoice reads its ordinary standing on
its own document page, and "To be credited" on every row that lists it.

## The form-open door's own guard: `FORM_REFUSAL`

`FORM_REFUSAL` (`mock/actions.ts`) is a table with one arm per form id whose OPEN can
itself be refused; a form id with no arm has nothing to ask here, and its own registry
entry alone decides whether it builds. `whyFormRefuses` looks up the arm for the form
being opened and runs it, and the `open-form` verb calls it before any registry entry
is even resolved — so a form whose subject can move between a row rendering its
control and the client's click is asked once, centrally, rather than inside its own
registry function.

Every arm asks the same shape of question in the same order: does the addressed
entity still exist at all (`addressedInvoice`/`addressedTicket`, or an inline `find`
for the two forms with no shared helper) — answering the standing not-found refusal
first, before it asks whatever the write itself would separately refuse on. Currently
guarded: the ticket message-edit, subject and related-product dialogs (the thread's
own editability/renamability/product-settability), the invoice payment-method dialog
(`whyNotMethodChangeable`), invoice pay-amount (`whyNotPayable`, asked in the tail's
own chosen currency), invoice share (`whyNotShareable`), and the product-label and
IP-whitelist-edit dialogs (a bare not-found on an unknown row, since neither write
refuses for any other reason). A document that stops being payable, shareable or
method-changeable — or a row that stops being editable — in the window between
rendering its control and the client's click answers with a refusal and no dialog,
rather than opening one whose own submit would then reject what was typed into it.

## Deep links

`useInitAction` (`composables/useInitAction.ts`) is legacy's `?init=` query
(`invoiceProvider.vue:433-437`, `cProdProvider.vue:988-993`, `products/index.vue:139`):
a route arriving with a known value opens that flow once, then the same turn replaces
the route without the param, so a refresh or a back-navigation never opens it a second
time — the route itself is the whole of the state, with no local "already ran" flag
beside it. `useRoute`/`useRouter` are imported from `vue-router` directly rather than
taken off Nuxt's auto-import, and both are called unconditionally before the query value
is even read, so the composable resolves the same pair wherever it is used. An invoice
reached with `?init=pay` opens nothing once the invoice is not payable — legacy skipped
the same deep link on a paid invoice — and the query param is dropped either way.
