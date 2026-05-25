# Workshop Initiator — Cart + Customer Panel Prototype (generic)

> This is the **base initiator** — agent-agnostic, single-prompt-fed to any LLM/agent that can read repo files and write code. Use this file directly with Aider, Codex, GitHub Copilot Workspace, the Anthropic API, or any agent that doesn't have its own platform idioms. For Cursor, use [`cursor.md`](./cursor.md) (adds Cursor-specific scaffolding). For Claude Code, use [`claude-code.md`](./claude-code.md) (adds Claude Code's slash commands, project memory, and subagent orchestration on top).
>
> **All paths in this initiator are relative to the handover bundle root** (the folder produced when the team unzips the workshop handover). The agent reads them directly; nothing references the Upmind monorepo at runtime.

---

## 1. Mission

Build a **working prototype** of an e-commerce cart + customer panel against the Upmind back-end. Two days. Greenfield. The output is credible-demo quality — not production-polished — proving the platform can be built against from a stack other than Upmind's own (no `headless`, no `ui`, no `client-vue`).

---

## 2. The thread we're building (BUILT)

A single end-to-end customer journey, top to bottom:

```text
Register (+ save card) → Login → Browse catalogue → Add to basket →
Adjust qty → Checkout (address) → Pay (Stripe, 3DS happy-path) →
Confirmation → Panel: subscriptions + invoices
```

Every fundamental platform mechanic gets *touched* (auth, basket, checkout, payment, panel reads). Working code the team can study, copy, port.

---

## 3. The thread we're not building (DOC'D-ONLY)

Covered in foundation docs + per-feature SDDs but NOT built in the workshop prototype:

- Configurable products · sub-products · custom fields
- Discounts
- Recurring billing term selection
- Cancel-with-revocation · upgrade flows · add-on purchase/cancel

**Now BUILT (promoted from DOC'D-ONLY based on workshop feedback):**

- Multi-currency switching — see SDD 02 (brand bootstrap) for the keyed currency list and SDD 04 (basket) for the `PUT /orders/{id}` currency-switch shape. The storefront renders a currency switcher in the chrome (header / footer) reading from `brand.currencies` and writing through the basket envelope.

If the workshop has time after the spine is settled and the team wants to extend, pick from the DOC'D-ONLY list above. Otherwise leave them as docs.

---

## 4. Staging environment + local DNS

> **Filled in the kickoff interview** (section 10, Step 0, Cluster 1). The agent asks the team; the team does not pre-fill this block.

Upmind resolves the brand, store, and client context from the **request's host header**. The brand record is keyed on its domain — `localhost` is not a brand, so the API will reject or mis-route every request hitting it. The prototype must run under the staging brand's domain locally.

```yaml
# Staging brand
api_base:          # e.g. https://api.upmind.io or https://api.staging.upmind.io — HOST ONLY, no trailing path. The /api/ path prefix is injected by the foundations layer's transport (see 03-foundations-chapter.md §1.1). Do NOT bake /api/ into this value.
brand_domain:      # e.g. contabo-workshop.upmind.app — the brand's storefront domain (used as the host for browser-side requests)
brand_id:          # the brand UUID (for sanity-checking that brand bootstrap returns the right record)

# Local development
local_host:        # the domain the dev server runs under locally (typically = brand_domain)
local_port:        # 443 with mkcert, or 80, or a brand-allowlisted alt port
dev_server_tls:    # true | false — most brand configs need https; use mkcert or Caddy for local certs
```

### Hosts file mapping

Point the brand domain at the loopback address so the browser sends `Host: <brand_domain>` to the local dev server:

**macOS / Linux** — edit `/etc/hosts` (sudo required):

```text
127.0.0.1   <brand_domain>
```

**Windows** — edit `C:\Windows\System32\drivers\etc\hosts` as Administrator with the same line.

Flush DNS after editing:

- macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
- Linux: `sudo systemd-resolve --flush-caches` (or `sudo resolvectl flush-caches`)
- Windows: `ipconfig /flushdns`

### TLS

Upmind brand configs typically require HTTPS. Two simple local options:

1. **[mkcert](https://github.com/FiloSottile/mkcert)** — generates a locally-trusted cert for `<brand_domain>`, feed it to the dev server (Vite / Next / SvelteKit all accept `https.cert` + `https.key` in config).
2. **Caddy reverse proxy** — let Caddy serve `https://<brand_domain>` with an auto-issued local cert and proxy to the dev server on a high port.

### What the agent does with this

- Every fetch in the prototype goes to `${api_base}` for the API and trusts the host = `${brand_domain}` for cookie / CORS scoping.
- Brand bootstrap (feature 2) reads the brand record using the host header — confirm `brand_id` matches what comes back.
- If the team sees CORS errors, brand-not-found errors, or session cookies not persisting, the hosts file / TLS setup is the first place to check.

---

## 5. Team profile

> **Filled in the kickoff interview** (section 10, Step 0, Clusters 2-3). The agent asks each question and captures the answers here; the team does not pre-fill this block.

```yaml
# Stack
framework:          # e.g. Svelte 5 / SvelteKit, Vue 3, React 19, Solid
build_tool:         # Vite, Turbopack, esbuild, …
language:           # TypeScript (strict|relaxed), JavaScript

# Styling
styling:            # Tailwind, vanilla CSS, CSS modules, Panda CSS, CVA
ui_kit:             # Skeleton, shadcn, daisyUI, none

# State + data
state_mgmt:         # Svelte stores, Pinia, Redux, Zustand, signals (Solid/Vue 3.5+), none
http_client:        # fetch wrapper, axios, ofetch, ky
caching:            # TanStack Query, SWR, custom store, none
form_lib:           # SvelteKit forms, Formik, react-hook-form, none

# Tooling
testing:            # Vitest + Playwright, Jest, Cypress, none for prototype
linting:            # ESLint config, Biome, oxlint, none for prototype
formatter:          # Prettier, Biome, dprint
typecheck:          # tsc in CI, in-IDE only, none
package_manager:    # pnpm, npm, yarn, bun

# Conventions
naming:             # kebab-case files, PascalCase components, camelCase fns — fill specifics
imports:            # absolute via tsconfig paths? relative? framework-default?
async:              # async/await preferred over .then(); error handling pattern
error_handling:     # throw + boundary, Result-style, custom Error subclasses

# Cadence
cadence:            # step (default) | factory — see section 10 cluster 5
stop_conditions:    # factory mode only — list of triggers that pause the run (e.g. "validation fails", "before payment", "any test red")
```

The agent reads this block first on every interaction and respects it for every code generation.

---

## 6. Architecture decisions

> **Filled in the kickoff interview** (section 10, Step 0, Cluster 4). One-time decisions captured during the kickoff; once locked, the agent doesn't re-litigate them.

```yaml
repo_shape:         # monorepo, polyrepo, single-app
folder_layout:      # by-feature, by-layer, hybrid — name the top-level dirs
module_pattern:     # how feature modules are organised (e.g. lib/<module>/ with index.ts barrel, machine.ts, services.ts)
http_layer:         # the chosen abstraction over fetch — where it lives, what concerns it owns
auth_layer:         # session / token storage, header injection
currency_injection: # how currency context reaches each request
error_normalisation:# how API errors are mapped to UI-friendly shapes
```

These directly mirror the **Foundations chapter** (`03-foundations-chapter.md`) — the foundations chapter describes the *concerns*; this block records the team's *implementation choices* for them.

---

## 7. Reference material — read these before generating any code

The agent reads these in this order on first interaction. Subsequent feature builds re-read the relevant module foundation doc.

### Architecture / contract docs (under `02-module-foundations/<name>.md`)

Each is a framework-agnostic description of what the platform exposes, the platform's data shapes, dependencies, the API endpoints, flows, and hard-won lessons. The agent treats these as the source of truth.

| Module | File | What it covers |
|---|---|---|
| `session` | `02-module-foundations/session.md` | Auth, token lifecycle, guest+client distinction, registration, password recovery, 2FA, auth-code transfer |
| `client` | `02-module-foundations/client.md` | Customer profile + sub-records (addresses, phones, emails, companies, custom fields) |
| `brand` | `02-module-foundations/brand.md` | Tenant identity, currency / language defaults, keyed brand config, T&Cs, module entitlements |
| `system` | `02-module-foundations/system.md` | Reference data (countries, currencies, languages, statuses, ticket departments, billing cycles, tax business types) |
| `productCatalogue` | `02-module-foundations/productCatalogue.md` | Catalogue browsing — paginated lists, category-scoped lists, search, basket-aware pricing |
| `productCategories` | `02-module-foundations/productCategories.md` | Category tree, breadcrumbs (via tree walker), category-type discriminator |
| `product` | `02-module-foundations/product.md` | Single-product read + initial configuration + seating into basket (`POST /orders`, `POST /orders/{basketId}/products`) |
| `basket` | `02-module-foundations/basket.md` | Basket envelope: create, claim, currency switch, promotions, billing, conversion to invoice |
| `basketProduct` | `02-module-foundations/basketProduct.md` | In-basket management: update / quantity / remove / validate / read provisioning values / bulk replace |
| `paymentDetails` | `02-module-foundations/paymentDetails.md` | Capture payment intent — stored cards, gateway picker, SDK handshake, produces `SelectPaymentMethodData` payload |
| `payment` | `02-module-foundations/payment.md` | Make the payment — submits payload, handles inline 3DS challenge / offsite redirect / awaiting-client |
| `invoices` | `02-module-foundations/invoices.md` | Immutable invoice record + payment lifecycle (load + retry + partial), contract / subscription reads |

### Foundations chapter (`03-foundations-chapter.md`)

Cross-cutting concerns: HTTP transport / auth header injection / currency injection / error shape normalisation / retry policy. Lives independently of any module. (i18n and analytics are out of scope for the prototype — covered in foundation docs for completeness but not built in the workshop code.)

### Per-feature SDDs (`04-sdd/<NN>-<feature>.md`)

Each spine feature has its own SDD. The initiator orchestrates them; the SDDs detail them. Build order in section 8.

> **If any SDD does not yet exist**, the agent generates it from the relevant module foundation doc + this initiator before writing implementation code. The SDD is the contract the implementation satisfies.

### Workshop plan (`01-workshop-plan.md`)

The locked planning decisions (scope cut, deliverables, day shape, audience). Reference, not read-every-feature.

### Build-your-own-core guide (`05-build-your-own-core.md`)

Synthesis over the foundation docs + Foundations chapter — "how to design your equivalent core that integrates with Upmind". Reference for the architects on the team; not required for every feature build.

### References (`07-references/`)

- `07-references/fixture-index.md` — pointers to captured API responses + what each is useful for (the prototype talks to the live staging API; fixtures inform typing + edge cases).
- `07-references/canonical-rule.md` — `docs-modules.md`, the standard the module foundation docs are written against. Useful when the team wants to iterate the docs after the workshop.

---

## 8. Feature sequence (build order with dependencies)

The agent builds features in this order. A feature's implementation cannot begin until its dependencies are complete and have passed their validation checklist.

```text
0. Project scaffold
   └─ Local DNS + TLS per section 4
   └─ Foundations layer (HTTP / auth / currency / errors)
1. Auth — register + login
   └─ Depends on: scaffold
   └─ Modules: session, client
   └─ SDD: 04-sdd/01-auth.md
2. Brand bootstrap
   └─ Depends on: 1
   └─ Modules: brand, system
   └─ SDD: 04-sdd/02-brand-bootstrap.md
3. Catalogue browse (grid + categories)
   └─ Depends on: 2
   └─ Modules: productCatalogue, productCategories
   └─ SDD: 04-sdd/03-catalogue.md
4. Basket (product page + configure + seat + cart manage)
   └─ Depends on: 3 (card click routes here)
   └─ Modules: product (configure read + seating), basket, basketProduct
   └─ SDD: 04-sdd/04-basket.md
5. Checkout — address
   └─ Depends on: 4
   └─ Modules: basket (PUT /orders/{id} for billing), client (address sub-records)
   └─ SDD: 04-sdd/05-checkout-address.md
6. Payment — Stripe 3DS happy path
   └─ Depends on: 5
   └─ Modules: paymentDetails (capture), payment (make), basket (convert)
   └─ SDD: 04-sdd/06-payment.md
7. Confirmation + Panel reads
   └─ Depends on: 6
   └─ Modules: invoices
   └─ SDD: 04-sdd/07-panel.md
```

Each feature is "done" when:
- Its SDD's checklist passes
- The relevant flow in the workshop scope works end-to-end against the staging Upmind API
- The validation checklist in section 9 below passes for that feature

---

## 9. Validation checklist — definition of done

The prototype is "done" when all of these pass against the staging Upmind brand:

- [ ] Local DNS + TLS set up; dev server reachable at `https://<brand_domain>` and brand bootstrap returns the expected brand
- [ ] Fresh visitor lands on the storefront and can browse the catalogue (whatever the test store exposes)
- [ ] Fresh visitor can register (with card capture) → logs in → lands on cart
- [ ] Returning client can log in
- [ ] Add to basket works, quantity adjustment works, total recomputes correctly
- [ ] Checkout: address selection / capture works, billing details persist
- [ ] Payment via Stripe 3DS happy path: capture method → submit → 3DS challenge → success → invoice paid
- [ ] Confirmation page renders the invoice number and totals
- [ ] Customer panel: subscriptions list + invoices list render, invoice detail page works
- [ ] All foundations from section 6 wired (HTTP / auth / currency / errors)

---

## 10. Agent instructions

This is the load-bearing block. Read it once, hold it for the duration of the workshop, refer back on every code-gen step.

**Role:** You are the implementation agent for a 2-day vibe-coding workshop. The human team (3-5 developers from the customer's organisation) drives — you propose, generate, and iterate. The team checks your work.

### Step 0 — Kickoff interview (run this BEFORE any code generation)

Sections 4, 5, and 6 of this initiator are deliberately blank. The team does **not** fill them in pre-workshop. You — the agent — fill them in by asking the team in a structured conversation at the start of the workshop. Ask in plain language, one cluster at a time, capture the answers verbatim into the relevant section, read them back, and confirm before moving on.

Pace it like a conversation, not a form. Group related questions. Skip anything the team has already told you in the chat. If they say "you decide", record your default choice and the reason, then proceed.

**Cluster 1 — Staging environment (section 4):**

1. What's the staging brand's storefront domain? (e.g. `contabo-workshop.upmind.app`)
2. What's the API base URL? (defaults to the public Upmind API unless they're on a dedicated host)
3. What's the brand UUID, if known? (used as a sanity check on brand bootstrap)
4. Has someone already edited `/etc/hosts` to point the brand domain at `127.0.0.1`? If not, walk them through it now.
5. Do they have a TLS strategy for local — mkcert, Caddy, or something else? Recommend mkcert if they have no preference.

**Cluster 2 — Stack (section 5, "Stack" + "Styling" + "State + data"):**

6. What framework + **specific major version**? (Svelte 5 / Vue 3.5+ / React 19 / Solid / other — pin the major; do **not** default to your training-cutoff version. If the team says "React" without a version, ask whether they want the current-latest or pinned to an older major. Same for the others.)
7. Build tool + version? (Vite 5+ / Turbopack / esbuild — usually whatever the framework picks, but pin a major)
8. TypeScript strict, relaxed, or plain JS?
9. Styling approach + **major version**? (Tailwind v4 / Tailwind v3 / vanilla / CSS modules / Panda / CVA — **Tailwind v4 vs v3 is a hard break** that changes config shape, plugin loading, and shadcn compatibility. If the team picks Tailwind without specifying, ask explicitly.)
10. UI kit + variant, if any? (Skeleton / shadcn — **shadcn's CLI assumes a specific Tailwind major**, confirm the variant matches the Tailwind version locked in q9 / daisyUI / none)
11. State management preference? (framework stores / Pinia / Redux / Zustand / signals / none)
12. HTTP client preference? (fetch wrapper / axios / ofetch / ky)
13. Caching layer? (TanStack Query / SWR / custom / none for prototype)
14. Form library? (framework-native / Formik / react-hook-form / none)

> **Before installing anything for the answers above:** verify the current major against the npm registry or the package's own site. Your training cutoff lags reality. See operating principle 11.

**Cluster 3 — Tooling + conventions (section 5, rest):**

15. Testing posture for the prototype? (Vitest + Playwright / Jest / Cypress / none — "none" is fine for a 2-day prototype)
16. Linter + formatter? (ESLint + Prettier / Biome / oxlint / none)
17. Typecheck enforcement? (tsc in CI / IDE only / none)
18. Package manager? (pnpm / npm / yarn / bun)
19. Any naming conventions you want locked? (file casing, component casing, function casing)
20. Import style? (absolute via tsconfig paths / relative / framework default)
21. Async pattern preference + error-handling shape? (throw + boundary / Result type / custom Error subclasses)

**Cluster 4 — Architecture decisions (section 6):**

22. Repo shape? (monorepo / polyrepo / single-app — for a 2-day prototype, single-app is usually right)
23. Folder layout? (by-feature / by-layer / hybrid — name the top-level directories)
24. How should feature modules be organised? (e.g. `lib/<module>/` with an `index.ts` barrel + service + state)
25. Where does the HTTP layer live, and what does it own? (auth header injection, currency injection, error normalisation, retries, base URL — the foundations chapter explains the *concerns*; you're asking the team to pick the *implementation shape*)
26. Where does the session token live? (memory only / localStorage / cookie — explain trade-offs if they're unsure)
27. How does currency context flow into requests? (per-fetch param / interceptor reads from a store / header)
28. How are API errors normalised before they reach the UI? (Result objects / thrown custom errors / framework-native)

**Cluster 5 — Build cadence (how the rest of the workshop runs):**

29. How does the team want to drive the build?
    - **Step mode (default)** — you (the agent) wait for explicit go-ahead at every gate. After each feature passes validation you stop, commit, and wait for the team to start the next one. Best for: teams who want to read every plan and diff, mixed-experience teams who use the workshop as a teaching loop, anyone unsure.
    - **Factory mode** — once a feature passes validation you auto-commit, announce "Feature N done, starting N+1 in 30s — type `pause` to stop", and proceed. For parallel-safe pairs (section 11), spawn a background subagent for the parallel stream. Best for: experienced teams who just want the prototype built and will spot-check at the end of each chunk; explicitly *not* a "fire and forget" mode — the team still reviews diffs and answers blockers.
    - The team can switch modes mid-workshop by saying so. Default is step mode if they're unsure.

Record the choice in section 5 under a new `cadence:` key. If factory mode is picked, also note the team's stop-conditions: any feature that fails validation pauses by default; any blocker the agent surfaces pauses by default; the team can add further stop-conditions ("pause before payment", "pause if any test fails", etc.).

**After the interview:**

- Write the answers back into sections 4, 5, 6 verbatim.
- Read the filled sections back to the team in summary form.
- Confirm. Then — and only then — start feature 0 (scaffold).

If the team interrupts the interview to start coding, finish the cluster you're on, capture what you have, mark the rest "TBD — ask when relevant", and continue. Don't block.

---

**Operating principles:**

1. **Spec over guess.** Always read the relevant module foundation doc + per-feature SDD before generating code for that feature. If either is missing, surface the gap to the team before proceeding.
2. **One feature at a time.** Build feature N, validate it, mark it done, move to N+1. Do not pre-build N+2 in the same pass.
3. **Respect the team profile.** Section 5 (stack) is inviolable. If a generated approach conflicts, stop and ask.
4. **Foundations first.** Section 6 decisions get implemented as a thin layer before any feature is touched. Every feature consumes them; none re-implements them.
5. **Real shapes from real captures.** The platform's response shapes are described in the foundation docs; `07-references/fixture-index.md` points to captured API responses for typing reference. Don't invent shapes.
6. **Host = brand domain, always.** Every request to the Upmind API is implicitly scoped by the host header (see section 4). Never hardcode brand identifiers the host should resolve; never run the prototype against `localhost` directly.
7. **Capture vs make boundary on payment.** `paymentDetails` captures (lists gateways, runs SDK handshake, produces `SelectPaymentMethodData`). `payment` makes (submits to `POST /payments`, handles response). These are two distinct surfaces — don't blur them.
8. **Diff to identify new basket entries.** Seating a product into a basket returns the full refreshed basket — the new entry is *in* the response but not flagged. Diff against pre-seat to find it. Cases to handle: one seating call can yield multiple new basket products; seating a quantifiable product already on the basket yields zero new entries (merges into existing + bumps quantity).
9. **`basket_id` on catalogue reads costs.** Supplying `basket_id` on `GET /basket/products/...` makes the BE recompute every price row against the basket's promotions. Use only when basket-accurate prices matter; skip on broad catalogue browsing.
10. **Verify against the spec before committing.** A feature being "done" means the validation checklist in section 9 and the SDD's per-feature checklist both pass — not just "the code compiles".
11. **Pin to current-latest, verify before installing.** Your training cutoff lags reality. Before running any `install <pkg>` command, check the actual current major version (npm registry, the package's own site for majors). Tailwind, shadcn, Next, Vue, React, Vite, and other fast-moving libs ship majors yearly — defaulting to your training-cutoff version installs the *wrong major* and downstream tooling (e.g. shadcn's CLI assumes a specific Tailwind major) will silently misbehave. If the team has no preference, ask once at install time which major to pin to, then record the version in section 5 of this initiator so it survives `/clear`. **Especially watch:** Tailwind (v3 → v4 is a hard break), shadcn (Tailwind-version dependent), Next.js, Vite, framework majors.
12. **Every form field gets a correct `autocomplete` attribute.** Password managers (1Password, LastPass, Bitwarden, browser-native), accessibility tools, and address auto-fill all depend on the HTML5 `autocomplete` token list — *not* on `name` / `id` / `placeholder`. Missing or wrong `autocomplete` tokens are one of the highest-impact, lowest-effort gaps a generated form can have. Reference: [MDN autocomplete values](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete). **Required tokens by form type:**
    - **Login form** — email/username: `autocomplete="username"`. Password: `autocomplete="current-password"`. Optional 2FA code: `autocomplete="one-time-code"`.
    - **Register form** — email: `autocomplete="email"` (and `username` if used as login). New password: `autocomplete="new-password"`. First name: `autocomplete="given-name"`. Last name: `autocomplete="family-name"`. Phone: `autocomplete="tel"`.
    - **Address form** — line 1: `autocomplete="address-line1"`. Line 2: `autocomplete="address-line2"`. City: `autocomplete="address-level2"`. State/region: `autocomplete="address-level1"`. Postcode: `autocomplete="postal-code"`. Country: `autocomplete="country"` (free text) or `autocomplete="country-name"`. Company: `autocomplete="organization"`.
    - **Payment form** — card number: `autocomplete="cc-number"`. Name on card: `autocomplete="cc-name"`. Expiry month: `autocomplete="cc-exp-month"` (or `cc-exp` for combined). CVV: `autocomplete="cc-csc"`. (Stripe Elements handles this internally; only relevant if you're building card UI yourself.)
    - **Never `autocomplete="off"`** on individual password fields unless there's a specific platform reason — it breaks password managers and is widely ignored by browsers anyway.
    Carry this principle through every form generation step in every SDD.
13. **Every interactive control reflects its state — pending, disabled, optimistic, error.** A storefront that fires `POST /payments` and doesn't disable the "Pay" button until the response lands feels broken — users double-click, fire two payments, or simply walk away thinking nothing happened. This is the single most common UX deficiency in generated storefronts: the code is right; the *feedback loop* is missing. **For every button, link, or control that triggers a network call or state transition:**
    - **Disable + pending visual on click.** The control becomes non-interactive and shows a spinner / loading text the moment the request is in flight. Re-enables when the response settles (success or error). Use `aria-busy="true"` on the button while pending.
    - **Optimistic UI for safe mutations.** Quantity +/- on a basket line, address-book reorder, "set as default" toggles — apply the change in the local store *before* the network round-trip and reconcile on response. Reverts on error. Do **not** apply optimism to anything destructive or money-moving (delete, pay, convert).
    - **Skeletons during list / detail loads.** Render a skeleton (block-shaped placeholders matching the layout) while a list or detail loads, not a blank space or a generic spinner that takes up the page. Skeletons preserve the layout's perceived stability across the network hop.
    - **Multi-step flow progress indicators.** Register → 2FA → identity-load is a three-step flow; checkout → payment → confirmation is a three-step flow. Render a progress indicator (numbered steps, checkmarks on complete, current-step highlight) so the user knows where they are in the journey. Don't surface intermediate steps as standalone pages with no orientation.
    - **Inline form-level saving state.** Form submits read "Saving…" on the submit button while pending; the form itself disables to prevent edits during the round-trip; a success line ("Address updated") appears for ~2s on resolve, then fades. Errors appear inline against the offending field (foundations §4.3).
    - **Toasts for non-form mutations.** Add to basket, set default, delete confirmed — surface a toast with the outcome. Never silently succeed for a user action.
    - **Verify in the UI, not just in the code.** Click through the prototype as a real user. If you click "Pay" and the button doesn't visibly change while `POST /payments` is in flight, the work isn't done — the code might be right but the feature isn't.
    A storefront that "works" but never reflects its own pending / error / success state to the user *feels broken*. Reflecting state correctly is not polish — it's a first-class part of the build.
14. **Use real UI primitives, not raw HTML, for every shipped surface.** A storefront and customer panel built with bare `<input>` / `<button>` / `<div>` elements feels like a developer test page even when the data is correct. The prototype's job is to demonstrate that the platform can be built against — it has to *look* like a cart and a panel for that demonstration to land. **Not overboard, not pixel-perfect — just credible.** Use the UI kit the team picked in cluster 2 (shadcn-vue / Skeleton / daisyUI / Reka / native primitives) for:
    - **Cards** for product tiles, basket line items, invoice rows, subscription rows, stored-card rows. Not bare `<div>`s with flexbox.
    - **Dropdown menus** for currency / country / language switchers, "more actions" overflows, sort selectors. Not `<select>` everywhere (use it where natively right — long lists, mobile — but reach for combobox / command-palette for searchable lists).
    - **Avatars** with initials or image fallback for the panel header, comment authors, anywhere the client identity surfaces.
    - **Dialogs / sheets / drawers** for confirmation prompts ("delete this address?"), add-an-address forms, configurator flows, payment-method picker. Not full-page redirects for every small interaction.
    - **Buttons with variants** — primary (`buy now`), secondary (`cancel`), destructive (`delete`), ghost (icon-only). Visual hierarchy reflects action weight; the destructive button reads visually different.
    - **Form fields with labels, helper text, error states, and inline validation feedback** — not bare inputs with no orientation. The autocomplete tokens from principle 12 ride on these.
    - **Toasts / banners** for non-modal notifications (success, warning, error).
    - **Skeletons** (per principle 13) for list / detail loading states.
    - **Progress / step indicators** for multi-step flows (checkout, register-with-2FA).
    - **Empty states with art / iconography** for "no orders yet", "no stored cards", "no subscriptions" — not blank divs.
    - **Layout primitives** — sidebar nav for the customer panel, top-bar for the storefront, breadcrumbs on category navigation.
    **Frontend design tooling.** If the team's Claude Code / Cursor / agent setup has Figma MCP, shadcn-vue / shadcn CLIs, magic-mcp, or any other design-aware plugin, **use it**. Don't hand-roll components when the plugin can generate a matching shadcn / Reka / Skeleton component in one call. Specifically:
    - `figma:figma-implement-design` — if Figma frames exist for the prototype, generate the components from them.
    - `shadcn` / `shadcn-vue` CLI — `pnpm dlx shadcn@latest add button card avatar dropdown-menu dialog sonner skeleton ...` produces production-shape components that match the picked UI kit.
    - Pre-built block patterns (`shadcn add login-01`, etc.) — start from a block, customise. Faster than from scratch.
    - The IDE's own design plugins / generators — surface them to the team rather than typing JSX from memory.
    **Honour the brand's visual assets where you can.** The brand bootstrap (feature 2) returns `brand.image` (primary logo), `brand.favicon`, `brand.email_logo`, `brand.brand_color`, and theme tokens. Bind them: storefront header reads `brand.image.url` (resolved through the asset-URL helper from foundations §1.1, since these are platform-relative paths); favicon is set via `<link rel="icon">` from `brand.favicon.url`; primary CTAs / accent colours pick up `brand.brand_color` rather than the UI kit's bare default. Not a polish step — a one-shot binding at app shell mount. This is nice-to-have rather than load-bearing (the spine works without it), but it converts the prototype from "generic shadcn template" to "the team's brand" at zero design cost. Skip only if the brand returns null assets across the board.

    **What "credible" means.** The prototype passes the credibility test if a non-developer on the team can look at the storefront and say "yeah, that's a cart"; the panel and say "yeah, that's an account area". Hierarchy, spacing, typography, colour all reading as "an app, not a debug page". You don't need design awards. You need to clear the bar of "shipped-shape, not test-page".
    Trade-off: budget ~20–30% of build time on UI primitives + layout polish. Skipping it makes the prototype demo poorly even when every API call works. Going overboard (custom animations, bespoke iconography) eats the spine. Use the picked UI kit, accept its defaults, move on.
15. **`basket.id === invoice.id` post-convert; convert is single-use; retries skip convert.** `PATCH /orders/{basketId}/convert` is destructive of the basket lifecycle — the same UUID becomes an invoice. The convert call is **not idempotent**: a second call against an already-converted basket returns 4xx (`409` or `422` with `"already converted"` shape). The user-visible scenario: payment fails for some reason, user clicks Pay again, storefront fires convert again, convert 4xxs, user sees "conversion failed" when actually the invoice exists. **Retry pattern:** when retrying a failed payment, **skip convert if you already have the invoice id in state** — go straight to `POST /payments` with the known invoice id. When convert returns 4xx, **inspect `error.message`**: if it matches "already converted" / "already an invoice" / similar, treat as success (the invoice exists), read the id from state, proceed to `POST /payments`. Don't re-litigate on retry. Cross-ref: basket.md "Convert is single-use; basket and invoice share the same UUID".
16. **`/api/invoices/{id}` returns the basket as an "invoice" pre-conversion** because basket and invoice share the UUID. Naive code that calls `GET /api/invoices/{basket.id}` for a basket that hasn't been converted yet gets a valid envelope back — the platform returns the basket as if it were an invoice — with `status.code` carrying a `*draft*` or `invoice_unpaid` value. Confirmation / detail surfaces must **status-check before treating the response as a real invoice**; otherwise the UI confidently renders a never-paid basket as "Invoice unpaid". The status code is the only signal that distinguishes a pre-convert basket from a real invoice.
17. **Platform status fields are objects, not strings.** `invoice.status`, `payment.status`, `contract.status`, etc. all carry the shape `{ id: string, code: string, name: string, object_type: string }`. Comparing `inv.status === "invoice_paid"` always returns false. Use `inv.status.code === "invoice_paid"` or, better, a helper (`statusCode(record)`) that pulls `.code` so callers never accidentally compare the object. This applies to every record with a `status` relation on the wire.
18. **"Paid" detection requires multiple signals, not just status.** A naive `status.code === "invoice_paid"` misses transitional / consolidated / partially-paid invoices that are effectively paid. The defensive predicate uses three OR signals: (a) `status.code.toLowerCase().includes("paid")`; (b) `payments[]` contains a row with `captured === 1 && refunded === 0 && !pending`; (c) `paid_amount_formatted === total_amount_formatted`. If any is true, treat as paid. Use the same predicate for the badge on a list row and for the count on a stat card — single source of truth. Cross-ref: invoices.md "The payment list grows across attempts and includes failures".
19. **Numeric `0` is overloaded across the platform — two different sentinels in the same data set.** Two trap patterns surface in builds:
    - **`0` as "no constraint"** — `product.unit_quantity: 0` / `product.min_order_quantity: 0` / `product.max_order_quantity: 0`. Treat as absent. **Use `||` fallback** (`step || 1`), NOT `??` (which preserves the explicit `0`). See operating principle 8 + product.md sentinel notes.
    - **`0` as "literal zero" REJECTED at the BE** — `SelectPaymentMethodData.wallet_amount: 0` is rejected with 422. The field must be **omitted entirely** for pay-in-full. See SDD 06 step 8.
    Two opposite directions of the same trap. Coercing to `0` works for one and breaks the other. Document the field-level intent in your types (`wallet_amount?: number` with prose "omit unless splitting payment"), and review every numeric `0` you send to the platform.
20. **`PUT /orders/{basketId}` and other basket-mutating calls require `?with=` to inflate the response.** Without the wide expand, the response is a thin id-only envelope; the next view sees `address_id` populated but `address: null`. The wide expand on rehydrate (`GET /orders/current`) is not enough — every mutating call needs the same expand on its own response, or the local state goes stale. Apply the basket's canonical wide-expand string on every basket-mutating PUT / POST / PATCH that returns the basket. Cross-ref: basket.md "PUT and PATCH responses inflate only what `?with=` requests".

**Per-feature loop:**

1. Read the feature's SDD (or generate it from the module foundation doc if absent).
2. Read the relevant module foundation doc end-to-end.
3. Confirm the team profile (sections 5 + 6) covers the choices needed; if not, stop and ask.
4. Generate the feature in the agreed conventions.
5. Wire it to the existing code from prior features (don't break section 8's dependency contract).
6. Walk the team through the result; iterate on feedback.
7. Update the feature's SDD if reality diverged from the spec.
8. Mark the feature complete in this initiator's section 8 checklist; move to the next feature.

**When stuck:**

- The team is in the room. Ask them.
- If they're stuck too, point at the relevant module foundation doc — the answer is almost always there.
- If the foundation doc itself is wrong, surface that as a gap — it's a real find, and worth recording.

**What you do not do:**

- Invent platform behaviour the foundation docs don't describe
- Use `headless`, `ui`, or `client-vue` from the Upmind monorepo — the prototype is from-scratch in the team's chosen stack
- Skip the foundations layer for "we'll wire it later" — it never gets wired later
- Treat `WAITING` / `AWAITING_CLIENT` payment responses as errors — they are platform-defined states with their own success path (see `payment` foundation doc)
- Hardcode brand-specific assumptions; everything keyed off the brand record / config

---

## 11. Workshop pacing

### Sequential baseline

- **Day 1 (8 hrs working, ~4-6 hrs of coding)**
  - 1 hr: walkthrough of the foundation docs + sequence + team-profile confirmation + local DNS / TLS setup
  - 2-3 hrs: foundations layer + auth (features 0 + 1)
  - 1 hr: lunch + discussion
  - 2-3 hrs: brand bootstrap + catalogue browse (features 2 + 3)
  - 30 min: end-of-day check — features 0-3 should be working
- **Day 2 (8 hrs working, ~4-6 hrs of coding)**
  - 2-3 hrs: basket + checkout (features 4 + 5)
  - 1 hr: lunch
  - 2-3 hrs: payment + confirmation + panel (features 6 + 7)
  - 1 hr: end-to-end walkthrough against the validation checklist (section 9)

Tight but achievable at coaching pace. The pacing isn't sacrosanct — drop a feature from BUILT to DOC'D-ONLY if it threatens the spine.

### Parallel work streams (if tooling supports it)

If the team's agent setup supports concurrent sessions — multiple terminals, background / detached agents, multi-pane IDE workflows — features that share no hard dependency can be built simultaneously. Trade-off: faster wall-clock progress, but a higher integration tax when the streams merge, and more coaching attention split across panes.

**Parallel-safe pairs** (per the dependency graph in section 8):

| Stream A | Stream B | Merge point |
|---|---|---|
| Feature 1 (auth) | Feature 2 (brand bootstrap) | Both consume the foundations layer; brand can fetch anonymously, so it doesn't have to wait for auth |
| Feature 3 (catalogue) | Feature 7 (panel reads — invoices/subscriptions list scaffolding) | Panel is reads-only; safe to scaffold against auth + foundations alone, then wire to real data after feature 6 lands |
| Feature 5 (checkout address) UI | Feature 6 (payment) SDK handshake scaffolding | Both wait on feature 4, but can split UI capture vs payment plumbing once basket is solid |

**Parallel-unsafe** — these MUST stay sequential:

- 0 → 1: foundations must exist before any feature
- 3 → 4: feature 4's product page is the route a feature-3 card click navigates to
- 4 → 5 → 6: basket → checkout → payment all mutate the same basket envelope
- 6 → 7 (real data): panel needs a paid invoice to display the happy path

**Rules when going parallel:**

1. **Lock the contract at the boundary first.** Before splitting, the team agrees the shape of what stream A hands to stream B (e.g. the session token format, the basket fetcher signature). Otherwise streams diverge and the merge is painful.
2. **Each stream re-reads its own foundation doc + SDD.** No cross-contamination — stream B doesn't read stream A's chat history; it works from the same artefacts.
3. **One person owns each stream.** Multiple humans on the same parallel agent session creates conflicting steers.
4. **Merge before moving on.** Don't start the next feature on top of two un-merged streams — collapse to one working state at every checkpoint.

If the team's tooling is single-session only (one agent, one terminal), ignore this subsection and follow the sequential baseline.

---

## 12. After the workshop

The deliverables remain:

- **Code**: in a repo owned by the team.
- **The handover bundle itself**: the team keeps it. Every artefact is self-contained — `01-workshop-plan.md`, `02-module-foundations/*.md`, `03-foundations-chapter.md`, `04-sdd/*.md`, `05-build-your-own-core.md`, `07-references/*`. They reference these forever; the docs describe the platform, not Upmind's code, and won't break when Upmind iterates.

**The agent does NOT keep running after the workshop.** This initiator is single-occasion; the workshop is the moment it gets used.

---

## Appendix — what's *not* in this initiator

- A go-live checklist (this is a prototype, not a production launch)
- A monitoring / observability strategy (post-workshop concern)
- A test plan beyond the validation checklist (prototype scope)
