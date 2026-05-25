# Build your own core

> Read after the workshop. This is the architect's synthesis over the bundle.
> The module foundation docs tell you *what the platform exposes*; the
> Foundations chapter tells you *how the wires connect*; the SDDs tell you
> *how each feature uses those wires*. This guide tells you *how to design
> the core layer for production*.

The prototype you built in the workshop is throw-away by design — single-stack,
single-brand, single-currency, Stripe-only, no observability, no tests beyond
the validation checklists. The point was to prove the platform is buildable
against from your stack. The next thing you build is not throw-away. This
document is what you read before you start that one.

---

## 1. What you're building

"Core" is the framework-agnostic layer between Upmind's HTTP API and your
application code. Your equivalent of Upmind's `packages/headless`. Not the UI,
not the routing, not the analytics envelope — the part that knows what the
platform exposes, what its response shapes mean, what its lifecycle states
look like, and how to keep the runtime model coherent as the user moves
through the spine.

You are **not** rebuilding the platform. The platform stays where it is. Every
catalogue read, basket mutation, payment submission, invoice fetch hits the
same endpoints your prototype hit. The job is to give your application a typed,
ergonomic, framework-aware shell around those endpoints — one that handles the
cross-cutting concerns once and presents domain capabilities to the rest of
your codebase.

The twelve platform modules map to six capability groups your core must
expose:

| Capability group | Platform modules | What it owns |
|---|---|---|
| **Identity** | `session`, `client` | bearer lifecycle, guest+client coexistence, profile + sub-records |
| **Tenant + reference data** | `brand`, `system` | brand identity, currency / language defaults, countries, billing cycles, T&Cs |
| **Catalogue** | `productCatalogue`, `productCategories`, `product` | paginated listings, category tree, single-product configure read |
| **Basket** | `basket`, `basketProduct` | basket envelope, per-line in-basket configuration |
| **Payment** | `paymentDetails`, `payment` | gateway picker + SDK handshake (capture); `POST /payments` + response handling (make) |
| **Invoice + subscription** | `invoices` | immutable invoice document, payment lifecycle, contract reads |

Two things this list is deliberately not:

- A list of folders. Whether you organise by feature, by layer, by capability,
  or some hybrid is your call. The grouping above is conceptual.
- A list of modules to rebuild. Each Upmind module is one solution to one
  problem space; some of its scope (e.g. `client` covering five sub-record
  collections under one umbrella) is convenience for our codebase, not platform
  contract. Treat the module foundation docs as a description of the
  *capability surface*, not as a prescription for your module boundaries.

The contract surface the platform actually exposes is captured in two places:

- The Foundations chapter (`03-foundations-chapter.md`) — transport, auth,
  currency, errors.
- The twelve module foundation docs (`02-module-foundations/*.md`) — one per
  capability area, with operations, data shape, dependencies, endpoints, and
  hard-won lessons.

Everything below builds on those two.

---

## 2. Recommended build sequence

The workshop builds features 0 → 7 sequentially because each one consumes the
state the prior one set up. For production you have more time, more flexibility,
and (likely) parallel streams. The recommended sequence is still close to the
workshop's; the rationale gets sharper.

### The non-negotiable order

```text
0. Foundations layer  (HTTP / auth / currency / errors)
   │
   ▼
1. Identity           (guest mint + login + /self)
   │
   ▼
2. Brand + system     (brand bootstrap + reference data)
   │
   ▼
3. Catalogue          (browse + single-product read)
   │
   ▼
4. Basket             (seat, mutate, claim on auth transition)
   │
   ▼
5. Checkout (address) (PUT billing details to basket)
   │
   ▼
6. Payment            (capture + make, basket → invoice)
   │
   ▼
7. Invoice + panel    (post-payment reads)
```

The dependencies that make this ordering non-negotiable:

- **Foundations before anything.** Every feature consumes the HTTP transport,
  the auth slot, the currency slot, the error normaliser. If they aren't in
  place when you write feature 1, you will inline auth-header attachment into
  feature 1's code, then again into feature 2, then again into feature 3, and
  then you will have four implementations of refresh-and-replay to reconcile
  the first time a 401 actually lands. The foundations chapter §2.5 is the
  single most-violated rule in the prototype agents we run — it is the rule
  most likely to be silently re-implemented per feature if the layer is
  missing.
- **Identity before any business call.** The platform has no useful
  unauthenticated mode (session foundation doc, lesson 1). A `GET /brand/settings`
  fails without a bearer; so does a catalogue read; so does an empty basket
  read. Mint a guest token first, then everything else.
- **Brand before catalogue.** The catalogue read needs `currency_code` and
  `lang` — neither has a sensible default until brand bootstrap has resolved
  the brand's defaults. A catalogue surface that fetches with a hardcoded
  currency renders blank prices for any product whose `prices[]` array doesn't
  have a row for the active currency.
- **Catalogue before basket.** You need a product before you can seat one.
- **Basket before checkout.** Billing details (`address_id`, `phone_id`,
  `company_id`) attach to a basket envelope; without a basket there's nothing
  to attach to.
- **Checkout before payment.** `POST /payments` runs against an invoice; the
  invoice is produced by converting a basket; the conversion requires the
  basket to carry billing details (basket foundation doc, capability 6 → 10).
- **Payment before panel.** The panel surfaces are reads against invoices and
  contracts. The interesting case (invoice-detail rendering, subscription
  list) needs a paid invoice. Until payment lands you can scaffold the panel,
  but you can't test it end-to-end.

### Where you can parallelise

Once foundations + identity are real, the dependency graph opens up. Streams
that can run concurrently:

| Stream A | Stream B | Why it works | Merge point |
|---|---|---|---|
| Brand bootstrap (2) | Identity / register (1.5) | Brand reads accept a guest bearer; brand bootstrap doesn't depend on a client token | Both gate on the foundations layer; both write to a shared brand / identity store |
| Catalogue browse UI (3) | Address-book + phone read (5 scaffolding) | Both are read-only against an authenticated client; neither mutates state | Wire the address picker into the checkout step once basket is solid |
| Catalogue single-product (3) | Stored-card list (6 scaffolding) | Same — both are reads, no cross-effect | Wire the stored-card list into the payment picker once basket+invoice exist |
| Payment SDK handshake (6 capture) | Confirmation page layout (7) | Confirmation is a read against an invoice id; the SDK handshake against Stripe is client-side until it hands the payload to make | Both wait on the basket → invoice transition before they can be tested end-to-end |

The rules of parallel work:

1. **Lock the boundary contract first.** Before splitting, agree the shape of
   what stream A hands to stream B. If stream A is "store the active client
   identity" and stream B is "render the panel header off the identity", agree
   the `Identity` type before either starts. Otherwise the merge is painful and
   one stream rewrites the other's types.
2. **Each stream re-reads its own module foundation doc.** No cross-stream
   chat-history contamination. The foundation docs are the shared source of
   truth; each stream consults its own.
3. **One owner per stream.** Two people on the same parallel stream produce
   contradictory steers; the agent (or the IDE, or the merge tool) eventually
   resolves the contradiction in a way that surprises both.
4. **Merge before moving on.** Don't start feature N+1 on top of two
   un-merged streams of feature N. Reduce to one working state at every
   checkpoint.

What you can **never** parallelise: foundations before features (0 gates
everything), basket conversion before payment (the invoice id doesn't exist
yet), payment landing before the panel's happy path (no paid invoice to
render).

---

## 3. Design decisions you'll face

Each subsection below names a real choice you'll make, what Upmind did, the
reason we did it, and where we'd think twice if we were starting over. The
decisions are not independent — the choice on §3.2 (state container)
constrains §3.6 (coordination), which constrains §3.7 (error handling). Read
all of them once before locking any of them.

### 3.1 HTTP layer abstraction

**The trade-off.** A thin HTTP layer (just `fetch` with a base URL) lets each
feature be transparent about what it's doing — but it pushes auth, currency,
error normalisation, retry, and refresh-and-replay into every feature, which
means each feature re-implements them or fails to. A thick HTTP layer
centralises the concerns — but it hides what's happening on the wire from the
features that consume it, and a misbehaving layer becomes a debugging
nightmare because the concerns it owns are invisible.

**Upmind's choice.** Thick — TanStack Query on top of a custom `fetch`-based
wrapper. The wrapper owns: base URL, bearer attachment, locale injection,
currency injection, JSON envelope unwrap, error normalisation into `AppError`,
retry on idempotent `5xx`s, refresh-and-replay on `401`, and request
cancellation. TanStack Query owns: caching, deduplication, stale-while-revalidate,
mutation invalidation. Features call `query.get(url, opts)` /
`query.post(url, body, opts)` and never reach `fetch` directly.

**Rationale.** The four cross-cutting concerns the foundations chapter
describes (transport, auth, currency, errors) all want to be owned in one place
so the rules are uniform — `200 + WAITING` is success here means it's success
everywhere, refresh-and-replay coalesces across every endpoint, currency
injection happens whether the feature thinks about it or not. The deduplication
TanStack provides matters more than you'd think; without it, the cold-start
brand bootstrap can fire six parallel `GET /brand/settings` calls because six
different consumers all want brand identity.

**What we'd change.** Less of TanStack, more of the wrapper. TanStack's
cache-key model is opinionated about how you express resource identity and it
fights you when the platform's identity model (basket id versus invoice id
versus the same UUID at different lifecycle stages) doesn't fit. The cache
invalidation rules become a parallel API that consumers have to learn. If we
were starting over we'd probably build a thinner caching layer over the same
wrapper — same auth / currency / error concerns, but with the cache contract
owned by us, not by a library.

### 3.2 State container

**The trade-off.** Every business state — basket, session, identity, payment
attempt, invoice — has rules about which transitions are legal and what state
the system is in at each moment. You can model these with ad-hoc reducers,
signals, observables, or full state machines. Ad-hoc is fastest to write and
hardest to reason about as the rules accrete; state machines are slowest to
write and easiest to reason about (and to test) once the rules stabilise.

**Upmind's choice.** XState — one finite-state machine per module. Session
machine, basket machine, paymentDetails machine, payment machine, invoices
machine, every other module's machine. Sub-states are explicit; transitions are
explicit; spawned actors handle long-running observation (e.g. polling an
invoice while a `WAITING` payment settles).

**Rationale.** Every Upmind module has a finite state set the platform
implicitly defines — the basket's `invoice_draft` / `invoice_unpaid` /
`invoice_paid`, the payment attempt's `OK` / `WAITING` / `REJECTED`, the
session's `anonymous` / `authenticating` / `authenticated` / `refreshing`.
Modelling those as machines means transitions are testable in isolation, the
illegal transitions can't happen by accident, and the debugger shows you
"here's the current state" instead of "here are five booleans you have to
reason about".

**What we'd change.** Simple modules probably don't need a full machine.
Catalogue browse is `loading → loaded → error`; system reference data is
`loading → loaded`. Wrapping those in XState costs verbosity that doesn't pay
back. If we were starting over we'd probably reserve machines for the complex
flows (auth, basket, payment, invoice payment loop) and use the framework's
native reactivity for the simple ones. Pick one stack and commit, though —
mixing two reactivity models within one module produces bugs that look like
race conditions but are actually update-order ambiguity.

### 3.3 Reactivity model

**The trade-off.** Whatever stack you pick (Svelte 5 runes, Vue 3.5 signals,
React + Zustand, Solid signals, plain RxJS), there is exactly one rule that
matters: every consumer of a piece of state reads it through the same
mechanism. Mixing — some consumers via reactive subscription, some via direct
property access — produces UI that updates inconsistently and racing that's
hard to diagnose.

**Upmind's choice.** Vue 3 reactivity (refs / computed / watch) combined with
XState. The state-machine `context` is wrapped in a `ref`; derived values are
`computed`; side effects are `watchEffect`. The two layers compose cleanly:
machines decide *when* state changes, reactivity decides *what re-renders in
response*.

**Rationale for the team.** Whatever stack you're on, do exactly the same
thing — pick one reactivity model, run all state through it. Svelte 5 runes
on top of XState works the same way (state-machine context wrapped in `$state`,
derived values via `$derived`). React + Zustand + a state-machine library works
the same way. The risk is *not* in picking the "wrong" model; the risk is in
mixing two.

**What we'd change.** Nothing — but we'd document the rule earlier. The bugs
we hit early in `headless` were almost all "this consumer reads via X, this
other consumer reads via Y, they disagree by one tick on currency switches".
Lock the rule before you write the second consumer.

### 3.4 Type-first vs runtime-first

**The trade-off.** TypeScript interfaces describe what you *expect* the
platform to return. Runtime schemas (Zod, Valibot, Effect Schema) verify what
the platform *actually* returns and refine it into a typed shape. Type-first
is cheap but lies the first time the platform sends a field you didn't expect;
runtime-first costs at the boundary but tells you when a contract drift has
landed.

**Upmind's choice.** Mostly hand-authored TypeScript interfaces in
`packages/types/`, with some runtime validation at form-submit boundaries
(checkout, registration). The bundle's fixture index
(`07-references/fixture-index.md`) points to real captured responses we use to
keep the interfaces honest.

**Rationale.** The platform's response shape evolves on a different cadence to
our code. Interfaces drift; fixtures don't. The lessons section of every
module foundation doc has at least one entry about "the typed contract is
narrower than the fixture" — `region_id` on addresses, admin-only fields on
`/self`, `meta` and `object_meta` bags on baskets. The hand-typed approach
worked for a long time and is finally hitting its limits.

**What we'd change.** Schemas at the boundary, hand-types behind the
boundary. The platform is the source of truth for what comes back; a schema
generated against captured fixtures (or, better, against the BE team's OpenAPI
if they ship one) catches drift at the moment it lands instead of at the
moment a feature reaches for a field that was renamed. The fixtures the
bundle ships are exactly the input you'd run a schema-generator against.

### 3.5 Module ownership boundaries

**The trade-off.** The platform's twelve modules overlap. `product` describes
single-product reads and seating; `basketProduct` describes in-basket
configuration. `basket` describes the basket envelope; `basketProduct`
describes the line items inside it. `paymentDetails` describes payment capture;
`payment` describes payment submission. If your modules slice the same domain
differently you end up with one capability documented in two places (and
inevitably contradicted).

**Upmind's choice.** Strict sibling demarcation. Each capability lives in
exactly one module. The pattern is consistent enough that the canonical rule
(ADR-019, `.agent/rules/docs-modules.md`) names it explicitly:

| Module | Owns | Forwards to sibling |
|---|---|---|
| `product` | catalogue read, initial configuration, seating | re-resolve / edit / remove → `basketProduct` |
| `basketProduct` | in-basket re-resolve, edit, remove, validate-saved | catalogue browsing + seating → `product` |
| `basket` | basket envelope (create, claim, currency, promotions, billing, conversion) | per-line product operations → `basketProduct` |
| `paymentDetails` | gateway list, stored cards, SDK handshake, produces `SelectPaymentMethodData` payload | `POST /payments` + response handling → `payment` |
| `payment` | `POST /payments`, three-axis response decision, inline-challenge rendering | gateway picking + SDK handshake → `paymentDetails` |
| `session` | identity / token / actor surfaces | client profile reads + sub-records → `client` |
| `client` | profile + sub-records (addresses, phones, emails, companies, custom fields) | identity / token → `session` |
| `invoices` | immutable invoice document + payment lifecycle observation | conversion → `basket`; capture → `paymentDetails`; submission → `payment` |

The `invoices` example is the cleanest four-way boundary in the codebase:
invoices loads the document and observes the payment lifecycle, but it
explicitly does not own the capture half (paymentDetails), the make half
(payment), or the conversion (basket). It coordinates by loading and refreshing;
the actual transaction flows through the siblings.

**Rationale.** When a capability lives in two modules, the two will eventually
implement it differently and the codebase will have to pick one. Picking it
once, in one place, with the sibling forwarding by URL reference, costs a
little ceremony at the doc level and saves a lot of reconciliation later.

**What we'd change.** Nothing material. The boundary that took longest to
get right was capture vs make on payments; we'd lock that one earlier.

### 3.6 Coordination mechanisms

**The trade-off.** Modules need to talk to each other without becoming
coupled. The basket needs to know when the session transitions guest → client
(to fire claim); the catalogue needs to know when the basket lands (to switch
its currency); the foundations layer needs to know when the user logs out
(to cancel in-flight requests). You can build this with: direct imports
(coupled), an event bus (decoupled but invisible), spawned observer actors
(decoupled and explicit but high-ceremony), or shared reactive state (the same
trade-off as §3.3 but at a higher level).

**Upmind's choice.** Spawned observer actors from XState. The session
machine emits actor-change events; the basket machine spawns a watcher actor
that subscribes to those events and triggers claim / refresh / clear
accordingly. The same pattern handles brand-readiness → feature-mount gating,
basket-landed → currency-slot-switch, payment-resolved → invoice-refresh.

**Rationale.** Decoupling via direct imports is hard to undo. An event bus
that nobody owns becomes a string-keyed mess. Spawned actors are the
opposite — explicit, typed, and the relationship is visible in the machine
that spawned them.

**What we'd change.** At minimum, build a session-change broadcaster from day
one. Basket, client, paymentDetails, and invoices all need to react to a
guest → client transition or a client → guest transition; an unstructured
"each module hooks the session via subscribe()" approach accretes silently into
something brittle. Even if you don't use XState, model the broadcaster as a
first-class object with a typed event schema.

### 3.7 Error handling philosophy

**The trade-off.** Errors can stop at the foundations layer (the layer
decides what to render and the feature never sees a raw error), at the feature
(the feature catches the `AppError` and decides what to do), or at the UI
(the feature throws or returns and the route's error boundary handles it).
Pick one and apply it consistently; mixing the three produces UI where some
errors render as toasts, some as modals, some as inline field errors, some
silently disappear.

**Upmind's choice.** Two-layer split. The foundations layer owns:

- HTTP status → category mapping (validation / auth / forbidden / not_found /
  conflict / rate_limited / system / offline).
- Field-error extraction from 422 responses (`error.data` keyed by field name).
- Correlation id capture for support tracing.
- Retryable flag.
- Treating `200 + status: "error"` as an error (envelope-level error).
- Treating `200 + WAITING` and `200 + AWAITING_CLIENT` as **success** — these
  are not errors, they are platform-defined success branches with their own
  consumer logic.

The feature owns:

- Whether to render as toast / modal / banner / inline field error.
- Whether to retry deliberately (e.g. payment retry surface).
- Domain-specific reactions to `WAITING` / `AWAITING_CLIENT` (e.g. invoices
  polls, payment renders gateway instructions).

**Rationale.** The categorisation rules are platform-wide; if every feature
implemented them, half would forget that `200 + WAITING` is success and the
payment surface would treat a settling 3DS attempt as failed. The rendering
choices are feature-specific; there is no single right answer for "where does
a validation error go?" without knowing what form it's against.

**What we'd change.** Make `WAITING` / `AWAITING_CLIENT` a first-class type
in your error model, not an afterthought. A `Result<T, AppError>` union where
the success branch is `{ ok: true; value: T; pending?: PendingHint }` makes the
pending case impossible to forget. The current shape — features inspect the
response body to decide whether `WAITING` matters — works but is easy to
break.

---

## 4. Common pitfalls (distilled from 12 module foundation docs)

Twelve modules' worth of "hard-won lessons" sections boil down to a small
number of behaviours that surprise every consumer who hasn't built against
the platform before. Each item below is one-liner + cross-reference; the
detail lives in the named foundation doc.

- **`200 + WAITING` / `AWAITING_CLIENT` are NOT errors.** They are
  platform-defined success branches. A `POST /payments` response with HTTP
  `200`, `status: "ok"`, `transaction_status: "WAITING"` means "submitted, not
  yet settled" (Stripe inline 3DS happy path) or "customer must act offline
  to complete" (bank transfer). Treating either as failure breaks every
  awaiting-client gateway in the brand's eligibility list. Cross-ref:
  `payment.md` ("Awaiting-client gateways are success-shaped but
  indeterminate"); foundations chapter §4.4; `invoices.md` (the invoice stays
  `invoice_unpaid` with `pending: true` on the payment row).

- **The next step on a payment is a three-axis decision, not a status string.**
  `transaction_status × approval_url × gateway.type`. `OK + null + any` is
  done. `OK + populated approval_url + any` is a challenge. `WAITING + null +
  AWAITING_CLIENT` is render instructions and wait. `WAITING + null + other`
  is poll the invoice. Flatten any axis and the consumer mis-routes a
  challenge as complete or a complete attempt as awaiting. Cross-ref:
  `payment.md` ("The next step is a three-axis decision").

- **Token refresh races.** Multiple parallel 401s must coalesce to one
  refresh, not N. The right shape: one shared in-flight promise, every
  subsequent 401 joins it. Refresh-token rotation means a second refresh fires
  against an already-rotated refresh token, fails, and signs the user out.
  Cross-ref: foundations chapter §2.5; `session.md` ("Token expiry can land
  mid-call", "Refresh rotates the refresh token").

- **Guest → client is a token swap, not a session replacement.** The guest
  token persists alongside the client token until basket claim succeeds.
  Logout drops the client token and reinstates the previously-held guest
  token — not a fresh mint. A storefront that overwrites a single "current
  token" slot loses basket claim and forces a re-mint on every logout.
  Cross-ref: `session.md` ("A guest token and a client token coexist in
  storage at the same time"); `basket.md` ("Claim is required after login
  and after the basket refresh that login triggers").

- **Seating returns the full basket, not just the new entry.** `POST /orders`
  and `POST /orders/{basketId}/products` both respond with the complete
  refreshed basket. The new entry is in there but unflagged. Diff against
  pre-seat to find it. Two cases the diff has to handle: (a) one seating call
  can yield multiple new entries; (b) seating a quantifiable product already
  on the basket yields zero new entries — the platform merges into the
  existing line and bumps quantity. Cross-ref: `product.md` ("The seating
  call returns the full basket"); `basketProduct.md`.

- **`basket_id` on catalogue reads triggers per-row recompute.** Supplying
  `basket_id` on `GET /basket/products/...` makes the back end load the
  basket and re-price every returned row against its promotions, applied
  coupons, and option overrides. Scales with both basket size and catalogue
  page size; paid on every request. Use only when you need basket-accurate
  prices (mini-cart upsell, basket-aware single-product reads in the
  configurator). Skip on broad browse. Cross-ref: `productCatalogue.md`
  ("Passing `basket_id` on a catalogue read is not free"); `product.md`;
  `basket.md`.

- **The basket is the currency authority once it exists.** Brand default
  applies until a basket lands; from then on the basket's `currency.code`
  drives every price-aware read. Login can switch the basket currency to the
  client's account currency on claim. A persisted preference does not
  override the basket — the basket wins. Cross-ref: `basket.md` ("Currency
  selection persists across sessions but cannot diverge from the basket");
  foundations chapter §3.2.

- **`meta` / `object_meta` fields are UI-flavour for Upmind's own client.**
  Brand, basket, product, and others return a `meta` (or `object_meta`) bag
  inside `data` carrying translation overrides, layout switches, cart-funnel
  routing for the first-party client. Not part of the platform contract.
  Ignore everywhere — types, render code, routing decisions. Cross-ref:
  foundations chapter §1.3; the `.meta` italic note at the top of every
  affected module foundation doc.

- **The brand-gateway eligibility list is a 2-way filter** (currency +
  country) with a `basket_id` shortcut. Passing `basket_id` derives both
  from the basket's currency and the basket's bound address. Use the shortcut
  when the basket is the source of truth; the gateway list goes stale on any
  amount / currency / country change so re-fetch on every basket mutation
  that touches one of those. Cross-ref: `paymentDetails.md` ("The gateway
  list needs re-fetching when the amount, currency, or country changes").

- **paymentDetails ends at the `SelectPaymentMethodData` payload; payment
  starts there.** Gateway picking and SDK handshake live in paymentDetails;
  `POST /payments` and response handling live in payment. The two surfaces
  share the payload and nothing else. If a paymentDetails-scoped file
  contains `POST /payments`, or a payment-scoped file picks gateways, you've
  blurred the capture-vs-make boundary. Cross-ref: `paymentDetails.md` and
  `payment.md` (mirrored "What it is" sections); SDD-06 operating principle
  #7.

- **The host header is the brand selector.** Brand resolution is by the
  `Host:` header on the request, not by a `brand_id` query parameter. Running
  the storefront on `localhost` fails brand resolution entirely (no brand
  configured for `localhost`) and renders defaults silently. Production
  deployments need every storefront origin registered against the brand
  (`oauth_clients`); an unregistered origin produces "everything renders
  defaults" rather than a clear error. Cross-ref: `brand.md` ("The host the
  cart loads on is the brand selector"); foundations chapter §1.1.

- **Tax recomputation reads from three places.** Brand tax-inclusion policy,
  per-client tax-exempt flag, and the basket's billing address all
  contribute. Setting an address on the basket triggers a full tax recompute
  — every line, every tax tag. Re-render the basket from the PUT response;
  don't try to stitch tax rows from a cached snapshot. Tax inclusion is a
  three-state enum (`tax_type: 0|1|2`), not a boolean — collapsing it loses
  the "include but respect client exemption" branch. Cross-ref: `basket.md`
  ("Tax behaviour reads from three places"); `brand.md` ("Tax inclusion is
  not a boolean").

- **The frozen client snapshot on an invoice does not follow live edits.**
  The `client`, `address`, `company`, `phone` records embedded on an
  `IInvoice` are captured at conversion time and never change after. A
  customer who renames themselves continues to see their old name on
  yesterday's invoice — which is correct (the invoice is a legal document)
  but surprises consumers who assume `invoice.client` is a live join. Render
  off the embedded snapshot; never apply a fresh `/self` over it. Cross-ref:
  `invoices.md` ("The embedded client / address / company / phone on an
  invoice is frozen at conversion time").

- **`payments[]` includes declined, abandoned, and pending rows.** Each
  `POST /payments` against an invoice appends a row regardless of outcome.
  Rendering the list naively shows declined attempts alongside the
  successful one. Filter to `captured === 1 && refunded === 0` for the
  receipt history view. Cross-ref: `invoices.md` ("The payment list grows
  across attempts and includes failures").

- **`payment_details: null` is the common case on payment rows.** Wallet
  draws and one-off card captures both leave `payment_details` null on the
  payment row. Reading `payment_details.card_last4` without a guard crashes
  on the most common production payment shape. Cross-ref: `invoices.md`
  ("Payment-row `payment_details: null` is the common case, not the edge").

- **The custom-fields catalogue is brand-keyed.** Registration custom fields,
  client profile fields, per-basket custom fields, and per-product
  provisioning fields all come from different endpoints with different
  rules. Hardcoding field names in your forms guarantees the form breaks on
  the next brand. Read the catalogue, render from it. Cross-ref:
  `client.md` ("Custom fields are brand-defined and orthogonal to the profile
  fields"); `basket.md` ("Custom fields exist at three levels and they do not
  share a definition source").

- **Subscription cancellation has revocation modes.** Out of scope for the
  prototype but consequential for production. A `Contract` carries
  `cancel_anytime`, `cancellation_date`, `moved_from_contract_id`,
  `moved_to_contract_id`. Cancellation flow is a write against the contract
  (not the invoice), with brand-specific rules about whether the customer
  gets the remaining term or loses it immediately. Cross-ref: `invoices.md`
  ("The contract `moved_from_contract_id` / `moved_to_contract_id` fields
  carry migration history"; "Contract linkage" in Core concepts).

- **Logout cancels in-flight requests bound to the client token.** Drop the
  client token, reinstate the guest token, invalidate every cache keyed off
  the prior actor — basket, panel data, payment methods — and cancel any
  request that was awaiting the client bearer (use `AbortController`). The
  platform has no logout endpoint; possession of the bearer is access. A
  caller who forgets to drop the client token leaves it usable until natural
  expiry. Cross-ref: `session.md` ("Local-only sign-out leaves downstream
  caches keyed to the prior actor"); foundations chapter §2.7.

---

## 5. Validation checklist — your core is "right" when…

Each item is testable. Cross-reference the foundation docs for the rule
behind each. The order of items mirrors the build sequence so you can tick
them off as the spine comes up.

### Foundations + identity

- [ ] An authenticated request whose token expires mid-flight is held,
      refreshed, and replayed without surfacing the 401 to the caller.
      Long-running calls (`PATCH /orders/{id}/convert`) do not fail with 401
      mid-call.
- [ ] Two parallel 401s trigger **one** refresh, not two. Subsequent 401s
      join the same in-flight refresh promise.
- [ ] A failed refresh clears the client token, surfaces a sign-in prompt,
      and does not retry. The user is back in guest state.
- [ ] Logout cancels in-flight requests bound to the client token, keeps the
      guest token alive in storage, and invalidates basket / panel / payment
      caches keyed off the prior actor.
- [ ] Every authenticated request carries `Authorization: Bearer <token>`.
      The only auth-bypassed calls are the guest mint and the refresh
      exchange.
- [ ] `200 + status: "error"` envelopes are categorised as errors.
      `200 + status: "ok"` with `transaction_status: "WAITING"` is **not**
      categorised as an error.
- [ ] A 5xx on an idempotent GET retries 2-3 times with backoff. A 422
      surfaces immediately with field errors keyed against the BE field names.
- [ ] 2FA-enabled accounts return an interim token (`actor_type: "twofa"`,
      `second_factor_required: true`); the interim token is not used for any
      call other than the `grant_type: "twofa"` exchange.

### Brand + basket + currency

- [ ] Brand bootstrap is one-shot per session. Reference data (countries,
      billing cycles) is cached aggressively; navigating to checkout does not
      re-fetch `/countries`.
- [ ] The active currency is the brand default at boot. As soon as a basket
      lands, the active currency is the basket's `currency.code` — even if
      the brand default differs.
- [ ] Login that lands a basket whose currency differs from the brand
      default (because the client's account currency took over on claim)
      switches the active currency without re-rendering blank prices.
- [ ] Catalogue browsing does NOT carry `basket_id`. Basket-aware
      single-product reads issued from inside the basket flow DO carry
      `basket_id`.
- [ ] Host header for every API call equals the brand domain. No
      `brand_id` query parameter is hardcoded anywhere.

### Basket + checkout

- [ ] Guest → client transition preserves the in-flight basket. After
      login, `PATCH /orders/claim` fires with the prior guest token in the
      body, and the next `GET /orders/current` returns the same basket id
      with `client_id` populated.
- [ ] The guest token is dropped only after claim returns 2xx. A failed
      claim leaves both tokens in storage so claim can be retried.
- [ ] Seating a product into a basket finds the new entry via diff against
      a pre-seat snapshot, not by trusting "the last item in the array is
      new". The diff handles both the multiple-new-entries case and the
      zero-new-entries (merge-and-bump-quantity) case.
- [ ] Every PUT against a basket-product re-sends the full
      `BasketProductConfig` — omitted fields are not "leave alone", they are
      "clear it".
- [ ] Setting billing details (`PUT /orders/{basketId}`) re-renders the
      basket from the PUT response (tax rows have been recomputed).

### Payment + invoice

- [ ] paymentDetails-scoped code does not call `POST /payments`.
      payment-scoped code does not pick gateways or run SDK handshakes. The
      only thing they share is the `SelectPaymentMethodData` payload.
- [ ] The brand-gateway list re-fetches when the basket's amount, currency,
      or bound country changes. A coupon that drops the basket under
      Stripe's minimum eligibility removes Stripe from the picker before
      submit.
- [ ] `WAITING` payment responses are mapped to a success-pending type, not
      to error. The invoice polls until terminal state or the poll cap is
      hit, then routes to confirmation with a "processing" hint either way.
- [ ] The invoice's `payments[]` list is filtered to `captured === 1 &&
      refunded === 0` for the receipt history view.
- [ ] Reading `payment_details.card_last4` is guarded against the
      `payment_details: null` case (wallet draws, one-off cards).
- [ ] The frozen client / address / company snapshot embedded on a paid
      invoice is rendered as-is, not live-joined against the customer's
      current `/self`.

### Cross-cutting

- [ ] No code path reads `meta` / `object_meta` for routing, layout, or
      data interpretation. The bags are silently ignored.
- [ ] Custom fields are read from their respective catalogue endpoints
      (`/clients_fields`, `/basket_fields`, per-product provisioning fields)
      and rendered from the catalogue. No field names are hardcoded.
- [ ] Tax-inclusion policy is carried as the three-state enum from brand
      bootstrap; the basket / checkout features interpret it. No code path
      treats it as a boolean.

If all of these pass against your staging brand, the core is solid enough to
take the rest of the platform on top. When one fails, fix the layer (or the
module) that owns it — not the surface that surfaces it.

---

## 6. Where to go next

The bundle stays with you after the workshop. Every artefact below is
self-contained and versioned with the platform contract, not with the
prototype.

- **The twelve module foundation docs** (`02-module-foundations/*.md`) —
  exhaustive per-capability reference. Read the relevant one before building
  any feature against that module. Each carries Operations, Data shape,
  Dependencies, API endpoints, Flows (where applicable), and Lessons. The
  Lessons sections are the highest-leverage reading in the bundle — they are
  what you would have learned over twelve months of building against the
  platform, distilled.

- **The Foundations chapter** (`03-foundations-chapter.md`) — the wires.
  Read once before any code is written; re-read when something in HTTP /
  auth / currency / errors stops behaving as expected.

- **The SDDs** (`04-sdd/*.md`) — feature-by-feature implementation contract,
  one per feature in the workshop spine. Each SDD names the modules it
  consumes, the calls in order, the data shapes the feature owns, the
  validation checklist for "done". When you build the production version of
  any spine feature, the SDD describes what "done" looks like; substitute
  your own implementation underneath.

- **The fixture index** (`07-references/fixture-index.md`) — pointers to 93
  captured API responses, one per endpoint family. Use these as input to a
  schema generator (§3.4), as test fixtures, as the source of truth when an
  interface drifts.

- **The canonical module-doc rule** (`07-references/canonical-rule.md` —
  copy of `.agent/rules/docs-modules.md`) — if you want to author your own
  module docs as your core grows. The rule is what the twelve foundation
  docs were written against; it captures the strip list (what implementation
  flavour to leave out), the section template, the dependants-table
  conventions, the lesson-pattern examples.

If the platform contract changes — Upmind ships a v2 endpoint, deprecates a
field, changes a response shape — the module foundation docs are the place
to look. They are versioned with the platform, not with this prototype, and
they describe behaviour the platform commits to, not behaviour of the code
that consumes it.

The team you partnered with (Upmind) is reachable. If a module doc is wrong
or a behaviour is surprising, surface it — we want the docs to improve. The
canonical rule has been sharpened across 13 module review cycles already; an
external review by a team building against the platform from a different
stack is the kind of feedback that makes the next version better than the
last.

Build the core that fits your stack and your team. The platform stays where
it is. Good luck.
