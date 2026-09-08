# Gotchas

Non-obvious facts about this app worth knowing before you touch it — recorded, not
theorised.

## Building and testing

- **The design-system submodule moved out from under this app's own chrome.** A
  submodule bump this app depends on removed several components it had built page
  chrome against — `ActionPane`, `BottomNav`, `ShellHeader`'s level prop, `Shell`'s
  bottom region, `SidebarNav`'s nested-levels support, a `Page`'s footer part, and
  `ListRoot`'s masonry layout variant. This app now owns portal-local replacements for
  every one of them (`shell/PortalActionPane.vue` over a `Sheet`, `shell/PortalSidebarNav.vue`,
  a bottom-nav strip, a page-footer band, chrome-level classes, a masonry class) built to
  preserve every prior render assertion. Each gap is recorded in `../ui-gaps.md` — if a
  future submodule bump reintroduces the missing piece, that register is where to check
  before re-inventing the workaround again.
- **`pnpm --filter` runs can rewrite `pnpm-lock.yaml`** in a worktree where
  `apps/hosting` isn't checked out (it isn't part of every worktree checkout). Restore
  the lockfile before committing if you ran package-manager commands scoped to this
  package from such a worktree.
- **A plain headless-Chrome `dump-dom` only shows this app's initial SPA shell.** This
  is a client-rendered SPA; a one-shot DOM dump taken without driving the page further
  proves nothing about a route reached by client-side navigation or about state after
  an interaction. The project's own read-back tooling (`tests/readback/*.mjs`) drives
  the app with Playwright instead — use that, or an equivalent scripted browser, not
  `curl` or a bare DOM dump.
- **A Playwright `page.goto` to a different route is a full page reload, and this app's
  entire mock dataset lives in module-level state.** Navigating to a second route with
  `page.goto` re-executes the app from scratch and reseeds the dataset — it does not
  carry forward a mutation made on the first route. Verifying that a mutation persists
  across a navigation means navigating _within_ the running page (a click, or
  `page.evaluate` against the app's own router), never a second `page.goto`.
- **The mock dataset is shared, mutable, module-level state across every mount in a
  test file.** `resetMockData(id)` (`app/portal/mock/store.ts`) is the only way to get a
  clean seed back; a test that mutates the dataset and doesn't reset it leaks that
  mutation into the next test in the same file.
- **Vue Test Utils' usual `NuxtLink` stub swallows the link destination.** A stub like
  `{ template: "<a><slot /></a>" }` renders no `href` at all, because it never forwards
  the component's `to`/`href` props through to the anchor. Tests in this app assert
  active-link state via `aria-current="page"` rather than the rendered `href` for
  exactly this reason.
- **A single button module renders no action — only its `group` variant reads a
  data-fed list.** `single` takes its own `label`/`value` props directly and has
  nothing that reads an `actions` array; a control that has to come from a data ref (a
  page's own Show-more, its footer, or anything else fed rather than authored) needs
  the `group` variant, even where the list it renders only ever holds one entry.
- **A control declared in a page config needs a mounted page test, not just a
  data-ref proof.** A data ref can resolve exactly the right value while the module
  that was meant to render it never appears on screen at all, because the page's own
  composition never wired the slot the control was supposed to sit in. Proving a
  page-level control means mounting the page and finding the control there, not just
  asserting what its data ref computes.
- **A hand-listed query-member set is how `?page=` got lost.** The route's query-borne
  context members used to be threaded by one hand-written line per member in the
  catch-all page's own query builder; `page` was declared on `DataRouteContext` and read
  by the thread's selectors for a whole phase before anyone added its line, so "Show
  earlier messages" rendered and asked for a page that never arrived. `ROUTE_QUERY_KEY`
  (`mock/injection.ts`) closes the class rather than the one instance: it is a typed
  record naming every query-borne member, `routeQueryContext(query)` builds the context
  by iterating it, and adding a member to `DataRouteContext` without adding it to the
  record fails the build. Never reintroduce a hand-written per-member line — add the
  member to `ROUTE_QUERY_KEY` instead, and every caller of `routeQueryContext` picks it
  up for free. A route's PATH-borne members (`groupSlug`, `productId`, `area`,
  `entityId`, `pillar`) are still assembled by hand per page — the closure covers the
  query half only.
- **An empty query value reads as an absent one, everywhere.** `routeQueryValue` (and so
  `routeQueryContext`) treats `?token=` with nothing after the `=` the same as `?token`
  never appearing at all — every reader of a query-borne context member expects "absent",
  never an empty string, so a link built with a blank value still reads as no value.

## Forms

- **The design system's `NumberField` only commits its value on blur**, not on every
  keystroke — a top-up amount or a price field won't validate (or be ready to submit)
  until the field loses focus, even though it looks like a normal input while typing.
- **The design system ships no relation-picker "Manager" style renderer.** Where the
  legacy company form used one, the stand-in schema substitutes plain enum pickers
  instead — a deliberate, declared divergence, not a missed transcription.
- **The platform's own `same` ajv keyword cannot directly express a confirm-equals-password
  check the way this app's change-password form needed.** If you're diffing this app's
  validation against the real platform's, that's why the wiring isn't a literal mirror
  there even though everything else in `mock/forms/ajv.ts` is transcribed keyword-for-keyword.

- **`PREVENT_CARD_REMOVAL_IF_LAST`'s own underlying configuration key reads the
  opposite of its name** — it is spelled as an "allow", not a "prevent"
  (`billing.gateway.allow_card_removal_replacement`). The portal's typed flag negates
  that raw value exactly as legacy did before it, so `PREVENT_CARD_REMOVAL_IF_LAST: true`
  is the correct reading of a brand that does NOT set the underlying "allow" key — don't
  "fix" the seemingly-backwards seed value without checking the raw key first.
- **The forced-auto-payment gate renders differently here than in legacy.** Legacy
  dropped the auto-pay checkbox from its edit modal entirely when the brand forces
  automatic settlement, offering no control at all. This app instead renders the switch
  checked and disabled, with a reason — a deliberate choice to show the state rather
  than hide the control, not a missed parity point.
- **The pay-in-another-currency dropdown offers more choices than legacy's did.**
  Legacy's own dropdown carried two currencies (the client's preferred payment currency,
  then the invoice's own). This app's carries those two plus every other currency the
  brand publishes a rate for — a superset, so nothing legacy offered is missing, but a
  side-by-side comparison against legacy will see extra rows that are not a bug.
- **A disabled `DropdownMenu` row action never shows why.** The design system's
  `MenuItem` takes a `disabled` flag but has no reason/title channel the way a plain
  button does, so "Retry verification" greyed out on a card the gateway will not
  reattempt, for one, carries its refusal reason in code but not on screen. Recorded in
  `../ui-gaps.md`.
- **A ticket reply's own verb carries no thread id.** `reply-ticket:<json>` writes to
  whichever thread the route context names, not to a thread named in the payload — the
  same reason `ticket-message-edit`'s dialog is addressed `<ticketId>:<messageId>`
  rather than by the message id alone: a message id is only unique inside its own
  thread.
- **The generic form-open door asks a guard before any dialog opens.** `whyFormRefuses`
  runs inside the `open-form` verb itself, not inside the message-edit form's own
  registry entry, so a message that stops being editable between its row rendering and
  the click refuses cleanly instead of opening a dialog whose submit would then reject
  what was typed into it. The invoice payment-method dialog asks the same door for the
  same reason: a document that stops being payable — settled, delegated, or its own
  payment now clearing — between the row rendering its Change/Select action and the
  client's click refuses with that reason instead of opening a form whose submit would
  then reject the card chosen.
- **The two-factor enrolment widening lives outside its stand-in.**
  `contracts/auth.schemas.twofa.ts` must stay transcribed export-for-export from the real
  headless module, so `mock/forms/twofa-enrolment.ts` adds the setup-key and
  `otpauth://` rows in its own module rather than editing the stand-in directly.
- **The transcribed two-factor pattern is unanchored.** The stand-in's `\d{6}` pattern
  (`contracts/auth.schemas.twofa.ts`) carries no `^`/`$`, so a seven-digit code also
  matches it — the same shape headless carries, transcribed export-for-export; it stays
  as recorded rather than corrected, since fixing it would stop the stand-in being one.
- **The referral-link form checks no host.** Legacy's own redirect field carries one
  rule, `required`; its "must be on the brand's domain" notice is unconditional words
  over the field, not a validation. The portal states the same notice on every brand and
  refuses only a blank field — an earlier build had added a host check legacy never had,
  and it was removed.
- **Tests are not type-checked.** A probe run (`tsconfig.tests.json` plus `vue-tsc`)
  against `tests/**` reports 127 errors. Closing that gate is follow-up work, not done
  as part of this build.
- **`client-invoices.share.schemas.ts` is not a stand-in.** Every other
  `mock/contracts/*.schemas.ts` file transcribes a real headless schema and is graded
  against it by `tests/standin-schemas.test.ts`; the share dialog's schema has no real
  file to mirror yet, so it is written directly in the future module's own shape
  instead and carries no parity test. Don't go looking for the real file it is
  supposed to track — there isn't one yet.
- **A list-module tag with an `action` renders as a `<button>`, not a `<span>`.**
  `modules/list/List.vue` switches the rendered element (plus `type="button"` and
  `aria-label`) on whether the tag object carries an `action` — a plain informational
  tag (Free trial, Delegated, a promo code) stays a `<span>`, while a tag naming a
  control (a product's own reference, opening the label form) becomes a real button.
  Reading every tag as inert markup misses the ones that are actually controls.
- **Paying with a new, unsaved card checks it and never stores it.** The pay dialog's
  "Pay with" new-card entry validates the typed card against the same field
  definitions the add-card form uses, but only stores the card where "Save payment
  details" is checked — an unsaved card is never created and then removed again, it is
  simply never written at all.
- **A bare invoice id opened against the pay-amount form is a known hole, not
  currently reachable.** `FORM_REFUSAL`'s pay-amount arm falls back to asking
  `whyNotPayable` in the invoice's own currency when the tail carries no card segment,
  so the door itself never refuses that shape outright — but the registry's own
  builder still requires the full `<invoiceId>:<paymentDetailId>:<currency>` tail and
  builds nothing for a shorter one, so a dialog opened that way would render empty.
  Every current caller passes the full tail (`payFormTail`), so the gap sits recorded
  and unexercised rather than closed.
- **Hiding the support PIN copies it first.** The aside panel's "Copy and hide" control
  writes the PIN to the clipboard, then masks it, in that order — reading the dispatch
  as "hide, and separately offer a copy" misses that a single click does both, copy
  before hide, matching legacy's own `copy_and_hide`.

## Tickets

- **A thread opens on its latest twenty entries, matching legacy, not its oldest.**
  `threadPage` takes the newest slice off the feed rather than the earliest one — the
  page it renders still reads oldest-first inside itself; it is only where that page
  starts, at the newest end, that differs from reading the feed straight through.
- **A scheduled ticket writes no status entry for the state it was born in.** The
  feed's status-change rows come only from the log a later close or reopen appends;
  starting a ticket already `SCHEDULED` records nothing, because nothing changed yet.
- **The thread's "Show earlier messages" control now pages for real.** Page one is the
  latest twenty entries; asking for more navigates to `?page=2`, which
  `ROUTE_QUERY_KEY` threads into `DataRouteContext` the same way as every other
  query-borne member, so the selectors see the wider page and the feed grows to forty
  entries, then sixty, and so on. See the gotcha above on `?page=` getting lost the
  first time — the fix closes the whole class of hand-listed query members, not just
  this one.

## Product lifecycle and credit

- **A product's suspension date and its purchase date are two different facts.** The
  timeline's suspension row reads `product.suspendedAt`, never `purchasedAt`/
  `createdAt` — a product suspended with no date on file says only that it is
  suspended, undated, rather than falling back to the day it was bought.
- **A lodged cancellation states its effective day only where one is on file.**
  `lodgedCancellationLine` (`selectors.ts`) never fabricates a day: a request booked
  before the brand has dated it reads "Cancellation requested on `<day>`." and stops,
  rather than naming an effective day that doesn't exist yet — the same reason the
  future-dated "Scheduled for cancellation" reading only fires once `cancelAt` is
  actually on the request; an undated booking of that same kind falls through to the
  plain "requested" reading instead.
- **A relative day reading only understands a bare calendar day.** `relativeReading`
  (`useMockContractProduct.ts`) turns a plain `YYYY-MM-DD` value into "today"/"in N
  days"/"N days ago"; a value carrying a full timestamp fails that pattern and falls
  back to stating the calendar day alone, never the raw stamp and never a relative
  reading guessed off a rounded difference.
- **The credit meter's "caution" band is `primary`, not a fourth tone of its own.**
  `@upmind/ui`'s `Progress` publishes `primary`/`success`/`warning`/`danger`; the
  four-band credit reading (danger under 25% remaining, warning under 50%, caution
  under 75%, success above) maps its caution band onto `primary` rather than forking
  the library for a tone it doesn't have. Reading the rendered tone and expecting a
  literal "caution" value will not find one.

## Collections and filters

- **A band control and a contract's named setter are two doors onto the same key.**
  `mock/collection-filters.ts`'s descriptors and a contract's filter map both have to
  agree on the criteria key a narrowing writes; a setter with no matching predicate in
  the collection's `source` closure compiles clean, runs clean, and narrows nothing —
  the only way to catch it is to call the setter and check the rows, not to read the
  types.
- **A flag setter and a band's yes/no option have to meet in one comparison.**
  `wantedFlag` (`mock/collection-filters.ts`) normalises both spellings — a module's
  named setter writes the contract's own boolean (`filters.successful(true)`), while
  the band's own control writes its option's value (`"yes"`/`"no"`) — into one boolean
  before `matchesFlag` compares it. A matcher that only understood one spelling left
  the other silently inert.
- **An unrecognised band value or enum member narrows nothing — which is a trap when
  probing a filter, not a proof it works.** Every predicate here reads an absent or
  unmatched criteria value as "don't narrow" (so the panel never throws on a bad
  value), which means calling a setter with a value the band or the row's own type
  does not carry passes every row through unfiltered. A probe that doesn't also assert
  the row COUNT dropped can read a broken narrowing as a working one.
- **Legacy's `MONTHLY_FROM` and the monorepo's `LOWEST_MONTHLY_PRICE` name the same
  concept under two spellings.** `PriceDisplayTypes.MONTHLY_FROM` is `"abs_min"` —
  legacy's own value, still seeded on hostgrid — while `LOWEST_MONTHLY_PRICE` is the
  monorepo's newer member for the same setting. The migration-quoting facade
  (`useMockContractProduct.ts`) honours both; reading only the newer member would miss
  every brand still seeded with legacy's value.
- **An order's `datePaid` filter is typed as a plain string, not off `IOrder`.**
  `IOrder` aliases `IInvoice`, which carries no `paid_datetime` field — legacy's own
  filter narrowed a BASKET key the order model itself never publishes, so the
  contract's filter is typed by hand rather than borrowed from the model.
- **The child-accounts name sorter covers legacy's two.** Legacy sorted a PERSON — a
  first-name sorter and a last-name sorter, `data/sorters/childAccounts.ts:5-9` — but a
  relation here names the account as one string, so one "By name" sorter is the
  correct landing for both, not a gap.
- **The credit page's wallet-movement ledger was a staff-only listing in legacy.** The
  client credit page never carried a line-by-line ledger panel to begin with in the
  system this app models — only the credit-statements panel is client-facing — which
  is why the client page here offers statements alone.

## Payability and clearing

- **`creditLimit.used` means the amount already DRAWN against the allowance, not the
  allowance itself.** What is left to spend is `allowance - used`; reading `used` as
  the remaining figure inverts the sense of every credit-at-pay-time calculation that
  depends on it.
- **The document never shows "To be credited", even on an invoice that is.** Legacy's
  own `InvoiceStatusMap(invoice, showToBeCredited = false)` takes the to-be-credited
  reading as a parameter, and the document's own banner calls it with the default
  `false` — only the compact row and order-row callers pass `true`.
  `invoiceStandingMessage` (the document) mirrors that default exactly; only
  `invoiceRowStanding` reads `invoice.toBeCredited`, and only while the document is
  still owed. Don't "fix" the document to read the flag too — that would be adding a
  reading legacy never gave it.
- **`isInvoicePayable` is narrower than "owed".** An invoice can be unpaid
  (`isInvoiceOwed`) while still not payable, because a payment already recorded against
  it is clearing — `isInvoicePayable` is `isInvoiceOwed(invoice) && !isInvoiceClearing(invoice)`.
  Anything that offers or accepts a payment reads the narrower flag; `isPartlyPaid` and
  the invoice-consolidation gathering still read the wider one, so don't assume every
  "owed" reader has the clearing case covered — check which one it calls.
- **The clearing state is modelled the other way round from legacy's own record.**
  Legacy carries a clearing document as PAID with a pending payment method; this app
  keeps the invoice's own status in its unpaid group (the one seeded example is
  `OVERDUE`) and hangs the fact off a pending OFFLINE payment recorded against it
  instead — `isInvoiceClearing` reads the payment, never the status. Reading a clearing
  invoice's own status field expecting PAID reads the wrong thing here.
- **The payment-method message's "Select" branch only renders on an account with no
  stored card at all.** Both shipped datasets seed twenty-four payment methods (one
  pads up to the standard list length, the other reuses that same list), so neither ever
  shows "Select" while driving the app — it is proved by a scoped test, not by anything
  reachable through either seed's own UI.
- **The vault write's staged-import refusal is graded on a clone, not a seed.** Neither
  shipped dataset seeds `staged_import`, so `whyNotEditable`'s refusal is proved by
  moving that fact onto a copy of the hostgrid dataset inside a test, not by driving
  either dataset's own vault panel into it.
- **`useInitAction` imports `useRoute`/`useRouter` from `vue-router` directly, not off
  Nuxt's auto-import.** Both are called unconditionally at setup, before the composable
  even knows whether the route's query names anything it should open, so they need to
  resolve the same way regardless of where the composable is called from — the explicit
  library import is what makes that safe.
- **The vault pin verb is `vault-pin:<id>`, with no scope segment.** A vault asset's id
  is already unique across the account and product panels, unlike the create verbs
  (`vault-note-create:<scope>...`), which do need one.
- **The affiliate payouts date filter reads when a payout actually paid, not when it was
  created.** Legacy's own listing filtered `created_at` under a "date paid" label — a
  mismatch corrected here rather than carried over; a payout still pending has no paid
  date, so the window never catches one.

## Data and seeds

- **The minimal dataset seeds no credit limit and no affiliate, by design.** Both are
  their own gate branches — an account with no `creditLimit` offers no credit-limit
  reading at pay time, and `affiliate: null` offers no affiliate area at all — so the
  limit-only credit reading and the commission-row states are graded on the richer
  dataset and clones of it, never on the minimal one.
- **Consolidating invoices gathers fewer than "every unpaid one" suggests.** One seeded
  dataset carries 24 unpaid invoices, but only 17 of them are offered for consolidation:
  the filter also drops a quote (a proforma is a promise, not a demand — nothing is
  gathered on the strength of one) and any invoice whose payment is already committed
  and sitting with the gateway (cancelling that document out from under a payment
  already in flight would strand the money and leave a closed invoice still asking the
  client to complete a transfer that no longer has anywhere to land).
- **Two seeds flip a flag purely so a test can reach the branch it exercises.** The
  richer dataset's default sign-in email now seeds unverified rather than verified, so
  "Enter verification code" has an address to render against. The minimal dataset's
  `INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF` now seeds `false` rather than `true` — that
  brand still runs no consolidation at all, so the banner never actually shows in the
  running app on this dataset; the flip exists so the "not restricted to staff" half of
  the gate is exercised somewhere, since the two flags are read together.
- **A dashboard product row's overflow menu no longer offers "View details".** Every
  provisioning function the provider publishes now appears there instead, followed by a
  manage action and a "Manage billing" shortcut — the destination "View details" used to
  open is still reachable through the manage action, just not under its old label.
- **An order's cancelled standing is asked about before anything else.** Every other
  branch reads the invoice ledger, which a cancelled order still has, so asking
  cancellation last would answer the wrong question first here even though it comes
  last in the sentences it derives from.
- **The wallet's filler movements are reconciled to the balance the account actually
  holds, not the other way round.** The ledger is anchored on that held figure and
  walked back, so a filler movement that doesn't net to nothing across its own month
  throws the whole chain off; account credit is never allowed to go below zero. The
  held balance stays a seeded fact rather than a derived one because two wallet tests
  read `data.wallet.balances` directly and assert that writes move it.
- **Document lines are gross.** A line's amount includes tax, so the line column adds
  to the document total, not to the subtotal; `inv-95` reads twenty-four lines at
  £0.50, subtotal £10.00, VAT £2.00, total £12.00.
- **`inv-95` was repriced to twenty-four lines at £0.50 each.** Its total is derived
  from its own lines rather than authored, and needed to stay at the £12 the
  credit-cap seeds are built around.
- **A notification body with no space before the truncation limit renders empty in
  legacy.** This app's own read-more cuts it at the limit instead — legacy's empty
  render there is a defect, not a behaviour worth cloning.
- **The email-preview lineage rows are gone, not hidden.** Legacy reserves "Resent
  from" / "Resent as" to staff; the client preview here dropped the rows, their
  selectors and their data refs outright — the seeded `resentFromId` field itself stays
  on the record, since removing the write's own data would make a resent email
  indistinguishable from an original one.
- **Every filler IP address is drawn from one of the three RFC 5737 documentation
  blocks** (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) —
  `hostgrid.filler.ts`'s `fillerIpAddress` cycles through them rather than inventing a
  plausible routable-looking address. A seed should never carry an address that could
  resolve to something real; adding a filler row means picking from one of those three
  blocks, not a realistic-looking one outside them.
- **The allowlist's two hand-authored rows use real-looking addresses on purpose**
  ("London office" at `82.14.210.7`, "Bristol studio" at `51.140.88.19`), unlike every
  filler row padded in behind them, which stays inside the RFC 5737 blocks above. The
  hero rows are what a reader sees first and are meant to read as a real client's own
  addresses; only the padding needs to stay obviously non-routable.
- **The tickets panel's own rows are a status-tab slice, not the whole array.**
  `ticketsCollection` first narrows `data.tickets` to the active/closed tab the route
  names, then applies the toolbar's filters on top — reading `data.tickets` directly,
  expecting the panel's own rows, misses that first narrowing.

## Repository layout

- **`apps/portal-nuxt/.gitignore`'s `/logs` rule is anchored at the package root** — it
  ignores a literal top-level `logs/` directory (a conventional build/log-output
  ignore), and does **not** touch the nested `app/pages/account/logs/` route directory,
  despite sharing the name. Nothing to fix; just don't assume the route is gitignored
  because the word matches.
- **Two page files became directories partway through this app's history**
  (`account/child-accounts` and `account/logs`), staged with `git mv` rather than a
  plain delete-and-recreate — if you're bisecting history around those routes, look for
  the rename, not a delete.

## Deliberately out of scope, not overlooked

- **The six client-vue families** — auth, email history, contacts, payment, orders,
  product setup. Stubbed, not mocked; `client-vue-adoption.md` carries their gap list.

- A product's ticket-tab "open ticket" button, the new-ticket scheduled-open datetime
  field, and the delegate-invite dialog's existing-client picker are all staff-only
  capabilities in the system this app models — they are not client-portal gaps, and are
  not built here.

## Decisions this app's owner should confirm, not this document

- **Confirmed 2026-09-07 (Rhodri):** the mock does not rebuild what client-vue ships —
  "we don't need to mock the client-vue components, as they are not new."

- Several forms in this app are served by **stand-in schema modules** rather than
  importing the real platform's schema files directly at runtime, because the real
  files sit behind an import graph that executes unrelated side effects the moment
  they're loaded. The stand-ins are graded against the real files by a dedicated test,
  but that architecture — stand-in now, real import later — is worth an explicit
  sign-off rather than being taken as settled by default.
- The four staff-only product notices (a moved product, paused provisioning,
  unresolved provisioning requests, a scheduled price change) were removed from the
  client view rather than kept client-visible, on the same rule applied to every
  other over-build here: a capability legacy reserves to staff is not built
  client-facing. The seed facts and their gates stay in the dataset for a future staff
  view. Confirm the removal, not merely the seed facts it left in place, is what
  should ship.
- An invented "All / Active / Renewing" product filter rail that had no basis in the
  system being modelled was found and deleted rather than kept — noted here in case its
  removal surprises anyone expecting it.
- The rule that work should land on one shared branch was relaxed partway through this
  app's build so review and verification could each see a clean, boundaried range of
  commits while the next batch of work continued in parallel. Confirm that relaxation is
  still wanted before assuming every future batch of work should follow the same
  pattern.
- Consolidating invoices narrows the "unpaid" set further still — a quote is excluded,
  and so is an invoice whose payment is already committed with the gateway, mirroring a
  rule this app's build carried over from the legacy platform rather than inventing.
  Worth an explicit confirmation that the narrower set is the right one to offer,
  rather than taking it as settled because it matches what came before.
- The shell now opens three dialogs — a confirmation, a form, and a read-only one for
  authored text such as payment instructions — where the build was originally scoped
  around a single form dialog. Confirm the read-only dialog is the right vehicle for
  this, rather than folding its content into one of the other two.
- A "Show delegated products" toggle from the legacy products screen was ruled out
  here rather than built, as belonging to a delegate persona's own view of an account
  rather than to this one. That ruling should carry its own follow-up record rather
  than the capability simply not existing anywhere, and is worth an explicit
  confirmation that no such record is missing.
- Legacy's email-history Resend and Retry actions are staff-only
  (`emailHistoryTable.vue:236,249`); they are removed from the client's own rows here
  rather than kept as an over-build, and the two verbs that used to answer them now
  refuse outright rather than staying reachable and inert. Confirm the removal itself,
  not merely the refusal it left behind, is what should ship.
- The affiliate payouts date filter narrows by when a payout actually paid rather than
  when it was created, correcting what legacy's own "date paid" label implies without
  changing anything legacy's filter itself did. Confirm the corrected reading, not
  legacy's own field, is what should ship.
- The email-preview lineage rows ("Resent from" / "Resent as") were removed from the
  client's own view rather than kept, because legacy reserves them to staff. Confirm the
  removal, not merely the seeded field it left behind, is what should ship.
- An earlier build of the referral-link form checked the redirect address against the
  brand's own domain; that check is removed because legacy's own field carries no such
  rule, only the unconditional notice and `required`. Confirm the corrected reading, not
  the earlier host check, is what should ship.
- The client credit page's wallet-movement ledger panel was removed rather than kept,
  on the same rule applied to every other over-build here: a capability legacy
  reserves to staff is not built client-facing. The ledger's own derivation stays
  behind the credit-statements panel, which is client-facing in legacy. Confirm the
  removal, not merely the underlying derivation it left in place, is what should ship.
- The child-accounts panel's "By address" sorter was removed rather than kept; legacy
  never published one, only a first-name and a last-name sorter. Confirm the removal
  is what should ship, not a control this app had invented.
- Two named filter setters this build had invented were withdrawn rather than kept: the
  affiliate commissions contract's `paid` setter (legacy's own commissions table
  publishes only a created-date filter) and the affiliate payouts contract's
  `destination` setter (legacy's own payouts table names no such filter). Confirm the
  narrower, legacy-matching filter maps are what should ship, not the wider ones this
  app had added.
- The minimal dataset seeds no credit limit and no affiliate at all, so neither area
  is reachable while driving that dataset in the running app — both are proved on the
  richer dataset and a clone instead. Confirm a minimal-seed brand going without either
  capability entirely, rather than a smaller version of each, is the right reading of
  "minimal".
- The document's own standing message was corrected mid-run to never read
  `toBeCredited` at all, matching legacy's own default
  (`InvoiceStatusMap(invoice, showToBeCredited = false)`) exactly; only a row's
  compact standing reads the flag, and only while the document is still owed. An
  earlier landing had the document read it too. Confirm the corrected, narrower
  reading — not the wider one first landed — is what should ship.
- Narrowing every `moduleRef`'s `props` to its own module's declared type — rather
  than the bare `Readonly<Record<string, unknown>>` every registration carries today,
  which lets one page config both invent an unused key and omit a required one and
  still typecheck clean — is filed as follow-up work rather than attempted here. The
  registry's `component` field erases each module's own prop type, and the great
  majority of this app's own props bags hand a live `dataRef(...)` marker rather than a
  literal value, so closing it needs a generic threaded through the resolver and every
  module's own type, not a local fix. Confirm that scope, and its priority, rather than
  assuming the type gap is already closed.
