# Contabo Workshop Planning

> Living artefact for the Contabo cart + customer panel workshop. Update as decisions land.

---

## Context

- Contabo: adopting Upmind's backend, building their own frontend from scratch.
- Not using Upmind's frontend packages (`headless`, `ui`, `client-vue`).
- Tech-stack-agnostic — not using Vue, no state machines, different naming conventions expected.
- Likely integrating the resulting cart/portal into their existing coding stack and existing platforms.
- Format: **2-day workshop with collaborative vibe coding**.
- Goal: working cart + customer panel prototype delivered by end of Day 2.

---

## Decisions locked

### Workshop outcome

A **fully working prototype** of the cart + customer panel by end of Day 2.

- *Working* = the flows function end-to-end.
- *Prototype* = not production-polished. Credible demo, not shippable product.
- Format = **collaborative vibe coding**, greenfield.
- Pacing = simple building blocks first, gradually working toward a prototype with core baseline functionality.

### Deliverables (5)

| Artefact | Audience | Purpose | Format |
| --- | --- | --- | --- |
| Working prototype | Workshop participants + Contabo team | Proves end-to-end buildability against the Upmind BE | Code (their stack TBD) |
| SDDs (per feature) | Agents / build executors | Prescriptive specs that drive vibe coding + later agent rebuild in their stack | Markdown, agent-feedable |
| Module reference docs | **Architects + senior devs** | Understand each core module: what, how, relationships, **gotchas** | Markdown |
| "Build your own core" guides | **Architects + senior devs** | Design their own equivalent core that integrates with Upmind | Markdown |
| Foundations chapter | All of the above | Cross-cutting concerns extracted from `query` and `system`: HTTP/auth header injection, currency injection, error shape normalisation, retry policy, i18n, analytics | Markdown |

### Audience framing

The docs (module ref, guides, Foundations) target **architects + senior devs designing interfaces/types and high-level coding principles** — not junior implementers. They already know how to build software; they don't know Upmind's platform.

> **Strategic note:** This work fills an internal Upmind gap, not just a Contabo deliverable. Devs across the board struggle with how modules relate, core concepts, and gotchas. The docs benefit Upmind onboarding, partners, and future clients too.

### Client-stated scope (Contabo)

Source: client's pre-workshop email.

**E-Commerce flow:**

- Registration including payment method (credit card)
- Simple product definition in Upmind
- Customers can order a product

**Customer Panel flow:**

- Login
- Overview of subscriptions
- Cancellation option (including revocation)
- Invoice handling / overview
- Upgrade options
- Purchase and cancellation of add-ons

> Doesn't preclude the fundamental platform features previously locked (configurable products, sub-products, multi-currency, recurring billing, discounts, custom fields, 3DS) — this is the customer-journey framing those features sit underneath.

### Workshop scope cut

The 2-day prototype shows the *spine* working end-to-end. Complex features are doc'd-only — covered in the module reference docs + SDDs but not built in the prototype code.

**BUILT — working code, one end-to-end thread:**

```text
Register (+ save card) → Login → Browse 2 products → Add to basket →
Adjust qty → Checkout (address) → Pay (Stripe, 3DS happy-path) →
Confirmation → Panel: subscriptions + invoices
```

**DOC'D ONLY — covered in docs/SDDs but not built in the prototype:**

- Configurable products · sub-products · custom fields
- Discounts · multi-currency switching
- Recurring billing term selection
- Cancel-with-revocation · upgrade flows · add-on purchase/cancel

**Rationale:** every fundamental mechanic gets *touched* (auth, basket, checkout, payment, panel). Working code Contabo can study, copy, port to their stack. Docs cover unbuilt features so it doesn't feel like cliff-edge gaps. They leave with shape + docs, not a polished cart.

### Vibe-coding stack

**Claude in VSCode.**

Tool choice is fungible — the agent does the work, the host is just where you type. The value lives in the SDDs and handover prompts, not the IDE or wrapper. If Contabo prefers Cursor or another setup on the day, swap freely; the artefacts (SDDs, prompts, ref docs) are the durable thing.

### Hands on the keyboard

Primarily **Contabo's team**, Upmind guides. Coaching / teaching dynamic. Prototype reference code in **Svelte** (pending Contabo confirmation).

### Workshop day shape

- 2 days × 8hr working days.
- ~4-6 hrs of actual coding per day (rest is discussion, walkthroughs, decisions).
- Total coding budget ≈ **8-12 hrs across the workshop**.
- Tight for the locked scope cut, but achievable at coaching pace.

### Pre-workshop prep window

**~1 day** available before Day 1.

### Documentation shape

Locked template — canonical rule lives at [.agent/rules/docs-modules.md](../../.agent/rules/docs-modules.md); the locked-decision rationale is captured in [docs/adr/019-module-doc-shape.md](../adr/019-module-doc-shape.md).

**Per-module reference doc — guidelines with consistent names + consistent order + required/optional split:**

- **Required** (every doc): What it is · Operations · Data shape · Dependencies · API endpoints (with curls + sample responses from fixtures) · Gotchas
- **Optional** (use these names when present): Core concepts · State model · Side effects · **Coordination** (helpers, subscriptions, sequencing, timing) · Flows (Mermaid + curl sequence)
- Sections always appear in the canonical order (above). No `n/a` filler — if it doesn't apply, omit.

**Foundations chapter:** HTTP / auth lifecycle / currency / error model / i18n / brand context.

**"Build your own core" guide:** what you're building / recommended sequence / design decisions / common pitfalls / validation checklist.

**Key principles locked:**

- Guidelines + consistent naming + consistent order + required/optional split (no `n/a` filler)
- All curls + responses sourced from real fixtures (captured fresh)
- "How you'd build it" hints in module docs only when they expose real IP and save man hours
- Gotchas sourced from story-review feedback, code comments, existing gotcha docs, graph's surprising connections, AND machine/sequencing/helper/subscription analysis. NOT from `.agent/rules/` (those are standards).
- **Coordination** is its own section — the real solutions to gotchas

### Output format and home

All written artefacts: **markdown**, version-controlled in the monorepo.

| Artefact | Home |
| --- | --- |
| Module reference docs | Inside each module — `packages/headless/src/modules/<module>/docs/foundation.md` (new artefact; existing `README.md` is internal-facing and stays untouched). Lives with source, won't drift. |
| Foundations chapter | `docs/developer-handbook/foundations.md` |
| "Build your own core" guides | `docs/developer-handbook/build-your-own-core.md` (+ any sub-files) |
| Workshop initiator (kickoff prompt) | `docs/workshop/_initiator/<agent>.md` (generic / cursor / claude-code variants) |
| SDDs | `docs/workshop/sdd/<NN>-<feature>.md` |
| Planning artefact | `docs/workshop/contabo.md` (this file) |
| Prototype code | Separate Svelte repo, owned by Contabo |

Rationale: durable docs live with source so they don't drift; client-specific docs grouped by client so structure is reusable for future clients.

### Core headless modules to document (14)

These cover the platform mechanics the client must understand to build their own equivalent.

| Module | Purpose |
| --- | --- |
| `session` | Auth, token lifecycle, guest+client distinction |
| `client` | User/customer record (deeply tied to session) |
| `basket` | Cart contents, currency, discounts |
| `basketProduct` | Items in basket, configurations, sub-products |
| `product` | Product schema, configurable options, sub-products |
| `productCatalogue` | Listing/browsing products |
| `productCategories` | Category structure |
| `payment` | Payment gateway abstraction |
| `paymentDetails` | Payment methods, 3DS |
| `orders` | Order finalisation + subscription lifecycle (cancel/revoke/upgrade) |
| `invoices` | Invoice list/view (customer panel) |
| `currency` | Multi-currency switching |
| `brand` | Brand context (cross-cutting) |
| `system` | i18n, dataLayer, places (cross-cutting substrate) |

> **Note:** `query` (HTTP/API layer) is *not* a documented module — it's our flavour (TanStack Query + URL building + token/currency injection). The *concerns* it embeds — auth header attachment, currency injection into requests, error shape normalisation, retry policy — are documented in a separate **Foundations** chapter that's framework-agnostic.

### Excluded modules

Not documented as modules for this client. Either specialist, internal-utility, our implementation flavour, or out-of-scope.

| Module | Reason |
| --- | --- |
| `domain` | Specialist addon (domain registration) |
| `recommendations` | Specialist addon |
| `feedback` | Specialist addon |
| `routing` | Vue-specific (funnels/Vue Router) |
| `theming` | Vue-specific |
| `config` | UI override system — Upmind-specific customisation |
| `dataManager` | Internal CRUD utility pattern |
| `lookup` | Internal CRUD utility pattern |
| `query` | Our HTTP flavour — concerns extracted into Foundations chapter |

---

## Open — to discuss

*Items raised but not yet locked. Resolve in subsequent sessions.*

- *(none — all initial planning questions resolved)*

---

## Next steps

- TBD — driven by next discussion.

---

## Change log

- *initial* — locked core/excluded module split (14 core, 9 excluded with reasons).
- *update* — swapped `invoices` (out → in) and `query` (in → out). Core stays at 14. `query` excluded as our HTTP flavour; its concerns are extracted to a Foundations chapter. `invoices` added for customer-panel scope (invoice list/view).
- *update* — locked workshop outcome (working prototype, collaborative vibe coding, greenfield, simple→complex pacing). Captured Contabo's client-stated E-Commerce + Customer Panel scope.
- *update* — locked **IN where: all three** (working code, SDDs, docs). Added Deliverables table (5 artefacts: working prototype, SDDs, module reference docs, "build your own core" guides, Foundations chapter). Locked **audience: architects + senior devs** designing interfaces/types/coding principles. **Gotchas** explicit as a documentation concern. Recognised the strategic value beyond Contabo (fills internal Upmind gap).
- *update* — locked **workshop scope cut** using the "model home" framing: one end-to-end thread built (register→login→browse→basket→checkout→Stripe→confirm→panel reads); complex features (configurable products, sub-products, custom fields, discounts, multi-currency switching, recurring terms, cancel-revoke, upgrades, add-ons) doc'd-only.
- *update* — locked **vibe-coding stack: Claude in VSCode**. Tool choice treated as fungible; value lives in SDDs + handover prompts, not the IDE.
- *update* — locked **hands on keyboard** (Contabo primarily, Upmind guides, Svelte pending confirmation), **workshop day shape** (8hr days × 2, 4-6hr coding/day), and **pre-workshop prep window** (~1 day).
- *update* — locked **output format and home**: markdown, in monorepo. Module ref docs in each module's folder; foundations + build-your-own guides in `docs/developer-handbook/`; workshop kickoff initiator + SDDs in `docs/workshop/`; prototype code in a separate Svelte repo owned by Contabo.
- *update* — locked **documentation shape** (full rationale in [docs/adr/019-module-doc-shape.md](../adr/019-module-doc-shape.md); living rule in [.agent/rules/docs-modules.md](../../.agent/rules/docs-modules.md)). Per-module template uses **guidelines + consistent names + consistent order + required/optional split** (no `n/a` filler). Required: What it is, Operations, Data shape, Dependencies, API endpoints, Gotchas. Optional: Core concepts, State model, Side effects, **Coordination** (helpers, subscriptions, sequencing, timing — the real solutions to gotchas), Flows. All curls + responses from real fixtures. Gotchas not sourced from `.agent/rules/` (those are standards). "How you'd build it" hints allowed only when they expose real IP and save time.
