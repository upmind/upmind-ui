# Changelog

One entry per commit that built this app's mock data layer and its forms, oldest first.

- **The mock closes every no-form legacy gap through composable facades.** Every new
  data surface becomes a facade typed against the real module it will one day be
  swapped for (or a contract where none exists yet), and every mutation becomes a
  `useActions()` method returning a receipt the dispatcher turns into a toast or a
  confirmation. Adds: toast and confirmation feedback with a two-tier refusal rule;
  money as data with real status enums; brand gates as typed config keys plus a second
  gates-off dataset; a parent persona with child accounts and login-as; listing filters,
  page size and grid/table view with row badges; invoice and credit-note documents with
  pay/share/print; order items and cancellation; payment-method default/auto-pay;
  a wallet with credit limit and statements; the contract-product model with
  provisioning, vault, lifecycle actions, migration and a scheduled-actions timeline;
  an account aside card, support PIN, real contact-data facades, IP whitelist,
  notifications feed and preferences, delegates, child-account relations, email history
  with preview, and affiliate; ticket detail rows and reopen/close/delegate/remove-product;
  template slots, footer, custom pages with nav injection, a not-found page, and the
  profile dropdown. Twenty contracts for future modules; forty-seven test files with
  colocated must-fail mutants, all confirmed red.
- **The form engine arrives.** Moves the design-system submodule to the first commit
  carrying its form engine and takes the matching dependency catalog; replaces the
  chrome parts that submodule commit removed with portal-owned equivalents (an action
  pane over a sheet, a bottom-nav strip, sidebar drill-down, a page footer, chrome
  levels, a masonry class). Adds the shared ajv instance, form engine reference data,
  the one form module, `MockActionResult.form` with the shell's one form dialog, and two
  worked examples: renaming a payment method (dialog, local schema) and profile details
  (inline, mirroring a real schema). Establishes that the real schema files can't be
  imported at runtime and introduces the stand-in-module pattern instead.
- **Contact, custom-field and security forms on stand-in schemas.** Stand-in schema
  modules transcribed from the real client-email, client-phone, client-address,
  client-company, client-custom-fields, and two-factor-auth schemas; local schemas for
  security (username, password) and the IP allowlist. Eleven registered dialog forms:
  add/edit email, phone, address, company; turn two-factor on/off; add an IP address;
  plus inline custom fields, username and password. New write methods on the contact
  facades; a new security facade; personal details gains custom-fields save and
  username change; IP whitelist gains create.
- **Test files, mutants and review fixes for the contact, custom-field and security
  forms, plus follow-up fixes for the form-engine commit.** Test files for the
  stand-in schemas (deep-compared against the real sources in a sandbox), the contact
  forms, the security forms, and the custom-field form, with their must-fail mutants —
  every mutant introduced so far confirmed red. Fixes: company edits keep their address
  and re-validate a changed tax number; custom-field values are typed; address regions
  and both address-related brand gates are seeded and reachable; minted ids get their
  own id namespace; duplicate phone numbers are refused; a conformance check is added
  for the security facade.
- **Billing settings, top-up, card entry, setup fields, consolidation, label and
  cancellation forms.** A billing-settings page on a local schema (currencies, an
  optional price list, consolidation with conditional day fields); a wallet top-up
  dialog gated by a brand flag; adding a card on a stand-in of the real card-entry
  schema plus the mock gateway's own card fields, with a failed-Luhn-check refusal;
  product setup fields as a confirm/revert form built from the product's own blueprint;
  inline product invoice-consolidation and custom-label forms; a cancellation-request
  dialog with an option, a scheduled date, a reason, and cancellation custom fields.
- **Ticket, delegate, vault, affiliate and notification-preference forms.** A new-ticket
  page (department when there's more than one, related product, body, attachment
  names) that creates an open thread; editing a ticket's subject from its manage menu;
  an invite-delegate dialog (email, access type, product/ticket grants); note and
  secret add/edit on both the account and product panels, with the scope carried in the
  submit verb; affiliate link create/edit, a withdrawal request, and a payout-destination
  form; notification preferences as a form with mandatory topics kept read-only. New
  collection facades for tickets and delegates; departments are seeded.
- **Test files and mutants for the auth screens, plus review fixes across the billing
  and ticket/delegate/vault/affiliate work.** Test files for the stand-in auth and
  account schemas (deep-compared against the real sources), the auth pages, the auth
  flows, and the logged-out shell, with their mutants — every mutant introduced so far
  confirmed red. Fixes: a payout destination clears itself on a non-PayPal code; ticket
  attachments render on the thread; a delegate grant requires a populated list; a
  rename guard; pending payouts carry a requested date; an invited delegate's
  permissions derive correctly; the email-verification code entry is wired up; the auth
  contract binds its four models to the real platform's own model types; conformance
  checks added for auth and billing settings; an empty scheduled date gets its own
  refusal reason; every stand-in names its own defaults export consistently.
- **Static auth screens on the real auth schemas.** Login (with a two-factor challenge
  step), register, forgotten and reset password, verify, verify-email, and logout — all
  on stand-ins of the real auth and account schemas, in a logged-out layout; the auth
  facade is typed against the real auth module's members it reuses.
- **Closure of the last fifteen legacy rows.** An account switcher and an avatar-change
  form; two token-authenticated preference pages; an organisation-registration screen;
  ticket messages grouped by author; dashboard setup cards and grouped products; a
  second affiliate gate; subtotal and discount invoice filters; a hard-cancellation
  warning; and four product notices (moved, paused provisioning, unresolved requests,
  scheduled price change). An invented, unsupported product-filter rail is deleted.
- **Test files, mutants and review fixes for the closure commit.** Test files for the
  account switcher and avatar change, the token preference pages, organisation
  registration, the dashboard closure work, and the product notices/filters, with their
  mutants, all confirmed red. Fixes: the moved-product notice is properly seeded; an
  unknown opt-in address is refused with its own reason; a client-account contract and
  its conformance check; a "receives emails" flag derives correctly from topic opt-ins;
  additional seed data so the discount band and the setup-cards cap are both drivable;
  the setup panel selects on outstanding required fields; a pending subscription seeded
  for the hard-cancellation branch; group-header rows carry test identifiers.
- **Second closure: related-product picker, row functions, invoice consolidation,
  email row actions, payment instructions.** A ticket's related-product picker, open on
  any thread that is neither closed nor locked, labelled "Add" or "Change" by whether
  one is already set; a dashboard product row's own button leads with the provider's
  highlighted provisioning action (falling back to a manage action), and its overflow
  lists every provisioning action plus manage and manage-billing, replacing the row's
  old "view details" entry; the invoices list offers to consolidate unpaid invoices
  where the brand runs consolidation and leaves it to the client, closing the originals
  into one new document; email rows gain "Manage notifications" on a verified address
  and "Enter verification code" on an unverified default; a pending invoice's
  payment-in-progress message can open the gateway's own instructions in a new
  read-only prose dialog — the shell's third, beside the confirmation and the form.
  New composable and contract additions for the picker and the prose dialog.
- **Test file, mutant and review fixes for the second closure.** Thirty-three specs and
  a blind-verified mutant for the second closure. Fixes: the consolidation banner also needs the brand to run
  consolidation at all, not only leave it to the client, before it shows; an invoice
  already mid-payment, and a quote, are never gathered into one; the "is this invoice
  still owed" check is one function shared by the pending notice and the
  payment-instructions action; the per-ticket actions contract is bound in the
  type-level checks.
- **Third closure: retry verification, scheduled tickets, pay in another currency,
  three brand gates.** An unverified stored payment method's row menu gains "Retry
  verification", greyed out where the gateway will not attempt a card twice; the
  new-ticket form gains a "Schedule for later" field behind a brand gate, opening the
  ticket `SCHEDULED` when the date-time given is still ahead and refusing one already
  past; the invoice Pay control becomes a currency dropdown behind a second brand gate,
  leading with the client's preferred payment currency, then the invoice's own, then
  every other currency the brand publishes a rate for, with the confirmation and the
  paid receipt both naming the amount actually charged. Three further brand gates bind
  to real configuration keys and are honoured: the affiliate withdrawal-request action,
  the refusal to remove a client's last remaining stored card (the default card stays
  protected regardless), and forcing automatic settlement on every stored card.
- **Test file, mutant and review fixes for the third closure.** Thirty specs and a
  blind-verified mutant. Fixes: every Pay control — the document's own, and a row's
  button and menu alike — now routes through the same currency choice and confirmation,
  where before a row's inline Pay bypassed both; a currency the brand does not quote a
  rate for is refused before any confirmation opens rather than silently settling in
  the invoice's own currency; the payment-detail actions contract is bound to the real
  facade in the type-level checks; the paid receipt now names the settlement actually
  taken rather than the document's own total. A `DropdownMenu` reason-channel gap
  (a disabled row action cannot say why) is recorded for the design system.
- **Fourth closure: reply attachments, post options, per-topic notification control,
  partial payments and account credit, related-product links, and one dropped
  staff-only action.** The reply composer carries attachment names and honours a
  post-options preference for which key sends; each optional notification topic gains
  a select-all/clear-all control; the Pay control offers another amount and account
  credit, moving the paid amount on a partial payment and spending from the wallet in
  the tender currency; a ticket's related product links to its notes and secrets where
  the brand allows; validating a company's tax number is removed from the client (kept
  for staff in legacy), with the validated tag reading the real brand key; the
  parent-branding panel reads its own real key too.
- A formatting pass straightens the gates table in this app's own architecture guide.
- **Thirty-eight proofs for the fourth closure**, each graded on both datasets where a
  key applies; two assertions that had asserted the removed tax action now assert its
  absence and the refusal instead.
- **A reply now refuses a closed or locked thread before it writes**, reusing the same
  closed/locked reasons the composer already read, instead of appending to a thread it
  should not.
- Proofs for the closed/locked reply refusal, and a widened per-topic select-all/clear-all
  proof that sweeps both directions of the control.
- **Fifth closure: a client can manage their own ticket messages, and read credit
  statements.** A message the persona wrote offers Edit, Delete and Remove attachment
  while its thread is open; a deleted message keeps its body behind a "View deleted
  message" dialog; credit statements appear on the wallet page for an account with a
  credit-limit allowance, each with a print view and a CSV download; the post-options
  form gains the new-line key choice; the credit cap and the pay refusal move into the
  invoice and wallet facades.
- **An edited message shows no marker to the client** — legacy reserves that to staff —
  though the edit still records when it happened.
- **Thirty-seven proofs for the fifth closure**, covering the own-message menu and its
  guards, credit statements, and the post-options and pay-with-credit fixes; three
  reply call sites are updated to pass a full message rather than a bare string.
- **Sixth closure: the order's own standing, statement filters, line collapse and
  read more.** An order's document message derives one of seven standings from its
  invoices and offers the same Pay entries the invoice does; credit statements become a
  filterable, sortable collection; a document past twenty lines collapses behind "Show
  more"; a notification body past 150 characters cuts on the last space behind "Read
  more".
- **Twenty-four proofs for the sixth closure**, covering the standings, the order Pay
  control, the statements collection, the line collapse, and read more.
- **The order Pay control now needs a published gateway**, matching the same gate the
  invoice's own Pay control already read; the wallet ledger becomes one shared
  derivation both the ledger pager and the statements panel read, replacing separately
  authored balance seeds.
- A proof for an order with no published gateway that is still part-paid, kept in its
  own branch order.
- Two mutant-patch headers corrected to name only the assertions they actually flip.
- **The order's cancelled standing now reads the order's own status ahead of its
  payment branches**, and an order matching none of the seven reads no message at all;
  the wallet's filler movements are reconciled to net to nothing per month, so the
  running balance this derives never goes negative.
- **Seventh closure: vault pinning, credit-note and affiliate toolbars, the invoice
  payment-method message, parent brand appearance, the header-logo key, once-only deep
  links, and the clearing state.** Vault notes and secrets can be pinned to the top of
  their panel and carry an author/editor line; credit notes gain a toolbar (search, an
  amount band, Allocated/Unallocated, an issued-date range, four sorters), on the
  account page and the product tab alike; affiliate links become a searchable, sortable
  collection, and commissions and payouts each gain a date-range filter and an amount
  sort; an invoice's document names the stored card that will settle it, with a Change
  or Select action opening a dialog form, and every Pay control honours that same card;
  a parent client edits the brand name, colour and font their child accounts inherit;
  the header logo follows the real `UI_LOGO_URL` key; `?init=pay` and `?init=upgrade`
  open their door once from the route and drop the query; an invoice with an offline
  payment still clearing hides its payments panel and every Pay control; the Username
  row is withheld when it equals the default email. Email Resend and Retry leave the
  client's own rows — legacy reserved both to staff.
- The deep-link composable calls `useRoute`/`useRouter` unconditionally at setup rather
  than only inside the branch that uses them, so it resolves the same way wherever it
  mounts.
- **Forty-one proofs for the seventh closure**, covering vault pinning and author lines,
  the credit-note and affiliate toolbars, the invoice payment-method message, the
  parent-branding form, the logo key, deep links, the clearing state, the username rule,
  and the removed email actions; the email-history, affiliate, invoice-document and
  list-band assertions that had asserted the old shapes now read the removed actions as
  refused and the new collections as paged.
- **A clearing invoice offers no Pay anywhere and refuses the write.** The list row,
  the document and the payable flag all read one derivation — owed and not clearing —
  and the pay write refuses a clearing document with its own reason before any dialog
  opens.
- Two assertions that had equated Pay with owed now read payable instead, with a
  clearing invoice proving the two apart; three proofs cover the clearing refusal
  through the facade and the dispatcher.
- **Every Pay path asks one payable guard.** `whyNotPayable` runs legacy's own order —
  settled, then clearing, then an unpayable currency — before any confirmation opens, on
  the bare Pay and the currency-and-card ask alike; the method message, its write and
  the pay-amount form all defer to the same payable flag, so a clearing document offers
  and accepts nothing. Credit-note filters gain the total band; affiliate sorts gain the
  amount sorter, and commissions carry no search, as legacy never had one; the dead
  email resend and retry writes are removed outright rather than left unreachable; a
  deep link on a settled invoice opens nothing.
- Two proofs cover a clearing document's absent method message and its refused write;
  the seeded pinned rows are proved to lead their panels before any write is made, so an
  ordering defect and a write defect are never mistaken for each other.
- **The payment-method form door asks its guard before it opens.** `whyFormRefuses`
  now branches on the form being opened and asks the same clearing/delegated guard for
  the payment-method dialog that its write already reads, so a clearing document
  answers with a refusal and no dialog rather than one whose submit would then reject
  what was typed into it.
- A mutant patch for the clearing write guard is corrected to name only the three
  assertions it actually flips.
- **Eighth closure: six client capabilities land, and the staff-only email lineage
  drops.** Delegates gain search, Accepted/Pending and full-access filters, and three
  sorts; login attempts gain an IP-address search and three sorts; tickets gain a
  created-date range. A new referral link prefills its redirect from the brand's own
  default redirect address, states the brand-domain rule, and refuses one off it before
  any write. The two-factor enable dialog states the setup key and the `otpauth://`
  link above the code box; disable asks for the code and refuses a wrong one. The email
  preview's "Resent from"/"Resent as" rows leave the client view.
- A formatting pass realigns the registered-forms table.
- **The affiliate redirect drops its host check, and the ticket band's created-date
  control is wired up.** Legacy's redirect field carries one rule, `required`; the
  brand-domain notice is unconditional words, so the host refusal and its reason go,
  and the prefill stays. The dead email-lineage panel, its data refs and its selectors
  are deleted with the over-build. One `mock/dates.ts` leaf replaces six
  locally-authored `today()` helpers; the delegates invitation filter becomes a plain
  flag.
- **Twenty-three proofs for the eighth closure**, covering the delegates and
  login-attempts toolbars, the ticket created-date range, the affiliate redirect
  prefill and its notice, the two-factor enrolment rows and the disable code, and the
  absent email lineage.
- **Fifteen mutants for the eighth closure**, covering the same ground; the redirect
  instruction builder loses an unreachable fallback.
- Three assertions tighten: the ticket band is graded on exactly its two controls, the
  link schema builder is proved to take its context, and the enrolment rows are graded
  readonly in the uischema as well as the schema.
- The affiliate link schema and default builders require their brand context
  explicitly, rather than defaulting it away.
- The sign-in log's toolbar and its named filters are wired to the same keys; the
  enrolment widening records that the transcribed six-digit pattern is unanchored.
- A documentation pass covers the eighth closure across the forms, architecture and
  gotchas guides.
- Proofs for the sign-in log's named setters; the successful setter, typed as a
  boolean, stays red until the flag comparison learns to read it.
- **Every flag filter now meets the band's option and the contract's boolean in one
  comparison.** `matchesFlag` normalises the criteria first, so a named setter called
  with `true` narrows exactly as the band's own "yes" option does, on the sign-in log,
  the delegates and the proforma filter alike.
- **The commissions filter map carries only the date legacy filters by.** Legacy's
  commissions table publishes one filter, created-at; the invented `paid` setter is
  withdrawn, with a mutant guarding the date narrowing.
- **The ticket reference and subject setters narrow, and the payouts map drops an
  invented destination filter.** A contains matcher backs legacy's own contains
  operator; the tickets predicate reads reference and subject, and the payouts filter
  map carries only the date legacy filters by.
- **Every named filter setter narrows the rows it names.** Invoice number and product
  scope, child-account search, product name and wallet currency now narrow; orders and
  referrals read one date key for both the band and the contract.
- **Ninth closure: ten client capabilities land, and the staff-only ledger panel
  drops.** Child accounts, the product Tickets tab, the delegate grant panels, the
  email log and the affiliate links gain their toolbars. The add-card form asks about
  auto payment unless the brand forces it. The consolidation form names the brand's
  own schedule from three real keys. The Username row links to Security and copies.
  The renewal action reads "Issue next invoice" or "Create late renewal invoice" by
  date. Migration prices switch to the lowest monthly figure under `PRICE_DISPLAY_TYPE`.
  The wallet-movement ledger panel leaves the client credit page; the ledger stays
  behind the statements.
- The wallet-currency mutant retires along with the panel it guarded.
- **Proofs for the filter seams and the ninth closure.** Every named setter is driven
  through its contract on both datasets; the wallet assertions read statements and no
  ledger; the migration quotes are graded against literal monthly figures, with one
  staying red until the facade honours legacy's monthly-from setting.
- **Migration quotes honour legacy's monthly-from setting and reorder by the monthly
  figure.** One named boolean accepts both enum members that name the same concept;
  hostgrid seeds legacy's own value, and the change-to picker orders its options by
  the cheapest monthly figure where the brand quotes monthly.
- Migration quotes and order are graded against four-option literals, and the
  child-account sorts are proved as three distinct orders.
- **Tenth closure: the order filters and sorters, the product status sort and tag
  filter, migration descriptions and the part-paid currency rule.** Orders filter by
  paid date, item service identifier and item category, and sort by number and status;
  products sort by status and filter by tag; each migration option states its short
  description and offers Review changes as prose; a part-paid invoice offers its own
  currency alone. The child-accounts "By address" sorter, which legacy never had, is
  removed.
- Proofs for the tenth closure, covering the order filters and sorters, the product
  status sort and tag filter, the migration descriptions and review dialog, the
  part-paid currency rule, and the two child-account sorts.
- **An order with no items still lists while nothing narrows by its items.** An absent
  item-level criteria value now matches before any item is walked, so an item-less
  order is never dropped from a listing nobody had filtered.
- A proof for an item-less order, which lists until an item filter is actually asked.
- **Eleventh closure: invoice standing, product tags, allowlist editing, top-up
  method, the share dialog and a delegated notice.** An invoice reads one of six
  standings with its proforma wording and its cancellation reason; product rows wear
  trial, delegated, reference and promotion tags and offer Add label; allowlist
  entries gain search and edit; a top-up names the card that funds it; Share opens a
  dialog (enable, link, regenerate, PDF and payment controls) and refuses on a
  delegated invoice; a delegated invoice says so. The four staff-only product notices
  leave the client view; their seed facts stay. Fourteen mutants and eleven
  header-title fixes land alongside.
- The architecture doc's tables are realigned.
- **The allowlist becomes a paged, searchable collection, and to-be-credited moves to
  rows alone.** The IP allowlist registers as a paged collection with filler rows and
  mounts its search band; the document's own standing ignores `toBeCredited` entirely,
  which only the invoice and order rows read, and only while still owed; the
  cancellation reason rides the cancelled standing alone. The share link reads the
  account's own sharing flag, and each regeneration mints a fresh token.
- The document to-be-credited mutant retires along with the reading it guarded.
- The filler allowlist addresses are corrected to stay inside the RFC 5737
  documentation blocks.
- **Twenty-three proofs for the eleventh closure.** Cover the six-state document
  standing, the row's to-be-credited reading, product tags, the paged and searchable
  allowlist with editing, the top-up method, the share dialog and the delegated
  notice; the allowlist proofs read a page of ten against the pager's own total, and
  the Credited tab is proved to carry two statuses.
- **Every guarded form door asks its refusal before it opens, and a tab holding two
  statuses asks which.** `whyFormRefuses` becomes a table with one arm per guarded
  form, checking the addressed entity exists before running its own guard; the
  invoice filter band applies one rule on every tab, so the Credited tab renders a
  status control exactly as the Unpaid tab does.
- Proofs for the share, allowlist and part-payment form doors and the Credited tab's
  status control; the allowlist pager narrows through a type guard rather than a
  cast.
- The invoice filter band's docstring states its single rule for what a tab's status
  control offers.
- A documentation pass covers the eleventh closure across the forms, architecture and
  gotchas guides.
- **Twelfth closure: paying with a new card, a spendable credit limit, commission
  states, ticket status entries and six more client capabilities.** The pay dialog's
  "Pay with" field gains a new-card entry beside the stored cards, with the add form's
  own card fields and a save box under them; an account's credit line becomes spendable
  at pay time — held balance plus what is left of its credit limit, read as legacy's
  own three sentences and capped at what is available; a delegated notice renders on
  the credit note and the order, alongside the invoice's own; an invoice row names the
  owner for a child-account or delegated document; affiliate commissions read six
  states with a toned amount; a ticket thread interleaves "Status changed to `<X>`"
  entries written by close and reopen; the thread gains a Messages / Attachments tab
  rail and pages past its latest twenty entries; an account-level email opt-out locks
  the matching per-address topic; a settled, non-clearing document wears a PAID stamp;
  referrals gain a date sorter both ways.
- A formatting pass realigns the registered-forms table in the forms guide.
- **Twenty-three proofs for the twelfth closure**, covering the new-card tender,
  spendable credit and its three readings, the delegated notices, the row owner,
  commission states, ticket status entries, the attachments tab and load-more, the
  topic lock, the paid stamp, the referral sort and the short-tail pay door; seven
  existing assertions are re-pointed to seed data moved to support the new capabilities.
- **The paid stamp is settled-only, the thread opens on its latest twenty, and an
  unsaved card is validated without a write.** A refunded or cancelled document wears
  no stamp; a long thread's first page is its most recent twenty entries, with message
  grouping run over the rendered feed so a status entry breaks an author's run; paying
  with a card the client does not save validates it and writes nothing.
- Further proofs for the thread's latest-twenty opening, the settled-only stamp, and a
  status entry breaking a message run.
- A documentation pass covers the twelfth closure across the forms, architecture and
  gotchas guides.
- **Thirteenth closure: forced card storage, the product lifecycle timeline, trial
  readings, the document details well and the credit summary.** A brand that forces
  card storage withholds the pay dialog's "Save payment details" box and keeps the new
  card whatever the client said, leaving the add-card dialog unchanged; the thread's
  Show-earlier control renders as a button group, with feed entries now carrying their
  own kind; the product billing tab's timeline derives renewal, next invoice, payment
  due or overdue (each linking its invoice), suspension, cancellation, termination and
  auto-renew-disabled readings, each read from today with a future-vs-overdue tone; the
  trial banner and its end-trial confirmation read one of four and one of three
  sentences from the product's own trial-end action; an invoice's client fields, custom
  fields and meta-data print in a footer well beneath it, invoices only; the credit page
  reads its summary sentence and tones its meter by the remaining percentage, with the
  caution band riding the meter's primary accent. Ten mutants join the new controls.
- Three existing assertions stay red after the thirteenth closure, until they are
  re-pointed to the timeline's new lifecycle rows and the thread's more-action becoming
  a list.
- **A suspended product states its own suspension day, not the day it was bought.**
  `suspendedAt` is a new fact on the product, seeded where a product is suspended and
  read by the timeline row in place of the purchase date it had been reading; a product
  suspended with no day on file now just says so, undated. The payment event derives its
  due and overdue shapes without a shared mutable title/description pair, and every
  relative-day reading falls back to a bare calendar day rather than a wrong one where
  the underlying value carries a full timestamp. One mutant guards the suspension day.
- **Twelve proofs for the thirteenth closure**, covering the rendered Show-earlier
  control, forced card storage, the lifecycle timeline, the trial readings, the document
  details well and the credit summary and its meter tones. One stays red until the
  billing page draws the lifecycle rows it derives on every product.
- **The billing timeline draws what it derives, links its invoices, and states days
  only.** The rail's own gate now reads the rows the timeline actually derives rather
  than the scheduled actions alone — gating on the actions had drawn nothing on 38 of
  the 39 seeded products; a timeline item may carry a link, and the payment event links
  its own invoice while the next-invoice event links the product's billing area; a
  suspended product with no recorded day states the fact undated rather than falling
  back to its purchase day, and every other relative reading states a bare calendar day
  rather than a full timestamp where the source value carries one. Three mutants join
  the controls.
- Proofs extended for the payment event linking its invoice, a datetime reading as its
  day rather than the raw stamp, and an undated fact carrying no date and falling to the
  end of the rail.
- **The timeline replaces its single sentinel-sorted pass with two explicit ones, and
  its gate returns early.** The dated rows sort by date and the undated ones follow, as
  two separate passes rather than one sort keyed on a placeholder value; the rail's own
  gate now returns false on a one-time purchase or an expiring trial before it asks what
  the rows derive to, rather than computing them regardless.
- A documentation pass covers the thirteenth closure across the forms, architecture and
  gotchas guides.
- **Fourteenth closure: the delegate invitation link, the product condition banner,
  per-status ticket sentences, a billing company, a toned unpaid notice, and the PIN
  copy.** Every query-borne member of the route context now threads through one typed
  map, so the thread's own paging control — and any future query-driven control — reach
  the selectors without a hand-written line to add; `/delegate-access/accept/[hash]`
  reads an invite as still verifying, accepted, or expired, with its own call to action;
  the condition banner gains most of legacy's remaining readings — cancelled, lapsed, on
  trial, an owed invoice, and active in its fulfilled and auto-renewing shapes — and a
  product matching none of them still draws a bare "Active" banner rather than none at
  all; a ticket's own standing reads one sentence per status; the product Settings tab's
  billing details panel picks a company beside an address, with its own door to add one;
  the unpaid-invoice notice tones danger when the product is suspended or an invoice has
  fallen overdue; hiding the support PIN copies it to the clipboard first. Eight mutants
  join the new controls.
- **Twenty proofs for the fourteenth closure**, mounting the pages against real routes:
  the thread's second page renders its next twenty entries, the delegate acceptance page
  reads each of its three states, every product draws the banner its own standing calls
  for, the billing details panel picks a company, the unpaid notice tones, and the PIN
  reaches the clipboard before it hides. One assertion — the client-replied ticket's own
  sentence — stays red until the next fix.
- **The condition banner reaches all fourteen readings, and a replied ticket gets its own
  sentence.** A cancellation scheduled for a future day now reads apart from one merely
  lodged, and awaiting activation with nothing left to fill in reads apart from one still
  waiting on the client — legacy's own two-way split of each. The client-replied ticket
  status gets its own sentence rather than reusing the open one. The token-page opt-ins
  screen now reads the same shared route-query builder every other page does, rather
  than its own hand-rolled copy. Two mutants join the controls.
- Proofs for the two newly split condition readings and the six ticket status sentences.
- **A cancellation booked for a future day, but not yet given one, reads as merely
  lodged rather than naming a day it doesn't have.** The "Scheduled for cancellation"
  reading now also requires the request to actually carry an effective day; one accepted
  before its day loads falls through to the plain "Cancellation requested" reading
  instead.
- A proof for the undated cancellation booking falling through to the lodged reading;
  one assertion stays red until the wording stops naming a day that doesn't exist.
- **A lodged cancellation states its effective day only where one is on file.**
  `lodgedCancellationLine` reads "Cancellation requested on `<day>`." alone where the
  request carries no effective day yet, rather than naming one that doesn't exist — the
  wording the previous fix's proof was left waiting on.

- **The client-vue cut.** Auth pages, email history, contacts, payment methods and paying,
  orders and product setup already ship as `client-vue` components over headless, so the
  mock stops mocking them: 13 routes render a "Provided by client-vue" stub, doors into
  them resolve to prose (`MOCK_ACTION.CLIENT_VUE_STUB`, `PAY_INVOICE`), and their facades,
  stand-in schemas, forms, verbs, data-refs, tests and mutant patches are removed.
  `docs/client-vue-adoption.md` records what mounts where and the legacy rules the
  components still lack. F19's inherited cards went with the payment-methods page.

- **The basket package lands, and nothing here changes.** The ADR 023 cut moves the
  basket, its `basketProduct`, `billing` and `product-setup` children and the checkout
  flow into `@upmind-automation/basket`. This app takes none of it: a portal has no
  in-flight order, so the package is not a dependency, its Nuxt module is not registered,
  and no file imports it. The phase touched this app's docs only — no page, component or
  route it renders changed.
