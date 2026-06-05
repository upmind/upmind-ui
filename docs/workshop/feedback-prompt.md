# Workshop feedback prompt — post-build retro

> Hand this prompt to the implementation agent **after** it has finished building the workshop prototype end-to-end (feature 7 validated, all SDD checklists green, panel reads working against staging). The agent writes a structured retro that drives the next revision of the bundle.
>
> Save the agent's response as `workshop-bundle/RETRO-<YYYY-MM-DD>.md` so the artefact lives alongside the bundle in the prototype repo, not just in chat.
>
> Run this retro every time the workshop is executed; the section headings are stable so retros diff cleanly across runs and pattern findings emerge ("SDD 04 has been flagged for ambiguous basket-diff in 3 of 4 runs").

---

## How to use

1. Wait until the prototype passes the validation checklist in [`_initiator/generic.md`](./_initiator/generic.md) section 9 and the per-feature checklist in every SDD.
2. Paste the prompt below verbatim into the agent's chat.
3. When the agent delivers the retro, save it to `workshop-bundle/RETRO-<date>.md` in the prototype repo (`Write` tool, agent does this).
4. Commit the retro to the prototype repo so the customer team has it as a reference.
5. Bring the retro back to the workshop maintainer (Upmind side) for the next revision of the bundle.

---

## The prompt — paste verbatim

````markdown
You've just finished implementing the Contabo workshop prototype end-to-end
from the handover bundle. Before you stop, I need a structured retro on the
process itself — not on the code you wrote.

The audience for your feedback is the workshop maintainer (me). I will use
it to revise the bundle, the initiator, the SDDs, the foundation docs, the
settings templates, and the kickoff flow before the next team runs it.

# What I need from you

A written retro covering every phase, with **honest negative findings
prioritised**. Most of the value is in what didn't work — wins are nice to
know, but they don't drive revisions.

Do not soften criticism. Do not hedge ("it was mostly fine but..."). State
clearly what was broken, ambiguous, missing, or wasteful. If something was
genuinely fine, say so in one line and move on.

# Output format

A single markdown document with these sections, in this order. Use the
headings verbatim so I can diff against future runs.

## 1. Identity
- Stack the team picked (framework + version, styling + version, UI kit,
  state, HTTP, package manager).
- Cadence chosen (step / factory).
- Total wall-clock time spent across both days, broken down per feature.
- Features that landed "done"; features that landed partial; features
  skipped or doc'd-only.

## 2. Kickoff phase (loading prompt → end of interview)
For each item below: did it work as written, or did you have to deviate?
- Did STEP 0 (drop templates from `workshop-bundle/06-initiator/templates/`)
  fire correctly? Any path or permission issues?
- Did the templates (`CLAUDE.md`, `.claude/settings.json`) reduce friction,
  add friction, or neither? Specifically: how many permission prompts did
  you still hit despite the broad allowlist, and for what tools?
- Was the Kickoff Interview (generic.md §10 step 0, clusters 1-5) the right
  shape? Any cluster you wished was added, removed, reordered, or split?
- Did the cluster 5 cadence question land — did the team understand the
  step-vs-factory choice well enough to pick one confidently?
- Was the version-probe question (cluster 2 q6/q9/q10) effective at
  catching training-cutoff drift? Did you actually run
  `npm view <pkg> version` before installing, or did you skip and regret?
- Did STEP 4 (tailor templates post-interview) work cleanly?

## 3. Foundations phase (SDD 00)
- Did the guest-mint-in-foundations split (SDD 00 step 8) work end-to-end?
- Was the `/countries` smoke test meaningful (proved wire-up) or
  redundant (you'd already proven it via the mint)?
- Anything in `03-foundations-chapter.md` that turned out to be wrong,
  incomplete, or contradicted by the actual platform behaviour?
- Anything in the foundations chapter you wished was there?
- The 12-item validation checklist (foundations §6): which items were
  hard to verify, which were ambiguous, which were redundant?

## 4. Per-SDD feedback (one block per feature 1-7)
For each SDD, report:
- **Was the SDD sufficient?** Could you implement the feature from the SDD
  alone, or did you have to dig into the module foundation doc or guess?
- **Endpoint reality check:** any endpoint shape, parameter, response, or
  status code that the SDD described wrong?
- **Missing edge cases:** anything the staging API did that the SDD didn't
  warn you about?
- **Dependency surprises:** did this feature depend on something that
  wasn't called out in "Depends on"?
- **Validation checklist gaps:** items you couldn't verify; items that
  were ambiguous; items that should have been there but weren't.
- **Time vs estimate:** was the workshop pacing in `generic.md` §11
  realistic for this feature, or off by 2x+ in either direction?

## 5. Cross-cutting platform behaviours
Did these operating principles + hard rules from `generic.md` §10 hold up?
- Host = brand domain (operating principle 6)
- WAITING / AWAITING_CLIENT are success-path states
- paymentDetails (capture) vs payment (make) boundary
- `paymentDetails` `add` context vs `buy` context (panel add-card vs checkout)
- Diff to find new basket entries after seating (operating principle 8)
- Don't pass `basket_id` on broad catalogue reads (operating principle 9)
- Latest-packages verification (operating principle 11)
- `autocomplete` attributes on every form input (operating principle 12)
- Interactive controls reflect pending / disabled / optimistic / error state (operating principle 13)
- Real UI primitives — cards / menus / dropdowns / avatars / skeletons / toasts — not raw HTML (operating principle 14)
- **Convert is single-use; basket.id === invoice.id post-convert; retries skip convert (operating principle 15)**
- **`/api/invoices/{id}` returns the pre-convert basket as if it were an invoice (operating principle 16) — confirmation status-checks for `draft`**
- **Status fields are objects with `.code`, not strings (operating principle 17) — `invoice.status.code === "invoice_paid"` not `invoice.status === "invoice_paid"`**
- **Three-signal paid-detection predicate, not just status code (operating principle 18)**
- **Numeric `0` overloaded: `||` fallback on constraint fields; omit entirely on payment fields like `wallet_amount` (operating principle 19)**
- **`?with=` expand on every basket-mutating PUT/POST/PATCH or the response goes thin (operating principle 20)**
- Brand card-storage policy keys (`billing.gateway.force_card_storage` etc.) honoured through SDD 06 + SDD 07
- Two path prefixes: `/oauth/*` at host root, `/api/*` everywhere else (foundations §1.1)
- Guest-token expiry → re-mint, not sign-out (foundations §2.4)
- Pagination unwrap preserves `total` (foundations §1.3)
- Asset URL resolution helper for relative paths (foundations §1.1)
- Currency switcher reads from `brand.currencies`, fires `PUT /orders/{id}/currency` post-basket, debounced
- Gateway eligibility needs all four filters (`basket_id` + `invoice_id` + `currency_code` + `country_code`)
- Automatic-payment capability check on gateways before `POST /payments`
- Platform query conventions: `filter[a.b]` dotted paths, `limit=count` magic, `skip_count=1`, `with_count=<rel>` (foundations §1.2)
- Brand-config flags DRIVE form validity, not just sit in cache (SDD 05)
- `GET /countries/{id}/regions?limit=0` (regions silently truncate without limit=0)
- Stripe Card Element: `hidePostalCode: true` + `billing_details` on `createPaymentMethod`
- Pay-this-invoice flow SKIPS convert (SDD 07 step 11)
- Three-category response model: 2xx-success / 4xx-error / **2xx-soft-failure with warning_notes** (foundations §4.7)
- Quantity-constraint sentinel values: `unit_quantity: 0` = no stepping, `min_order_quantity: 0` = no minimum (product.md)
- `provision_field_values_validate: false` on seating to defer validation (basketProduct.md)
- POST-create vs PUT-update body divergence on basket products (basketProduct.md)

For each: did the principle save you from a bug, or did you violate it and
suffer? Or was it never tested in this run? Be especially specific about
**soft-failure detection** — did you implement the diff-against-pre-call
pattern, did you miss it, did the staging API give you a chance to test it?

## 6. Build cadence
- If you ran **step mode**: was the per-feature ceremony
  (`/workshop-feature N` → plan → go → build → validate → commit) the right
  rhythm, or did it feel over-engineered for short features / under-
  engineered for long ones?
- If you ran **factory mode**: did the 30s pause-window work? Did the team
  spot-check meaningfully, or were they passive? Did you spawn parallel
  subagents per the table in `claude-code.md`? Any merge friction?
- Did the team switch modes mid-workshop? Why?
- Stop conditions: did any fire? Were they the right ones?

## 7. Slash skills + Claude Code mechanics
- `/workshop-kickoff`, `/workshop-feature`, `/workshop-status` — which got
  used, which didn't, which felt missing?
- TodoWrite usage — too much, too little, just right?
- `/clear` between features — helpful, or did you lose useful context?
- Subagents (if you used them): how did the spawn prompt template hold up?
  Anything you had to add to make the subagent actually self-sufficient?

## 8. Documentation gaps
Three lists, no commentary:
- **Things that should have been in the bundle and weren't.**
- **Things that were in the bundle but I never opened.**
- **Things in the bundle that turned out to be flat wrong.**

For each item flagged, name the file path + section / line range. Don't
generalise — concrete citations let the maintainer turn each finding into
a one-line edit.

## 8a. Request-shape verification gaps (v1 fixture format only)
v2 fixtures (per `07-references/fixture-format.md`) capture request bodies
alongside responses. The current bundle ships v1 (response-only). For every
mutation endpoint you hit during this workshop:

- Did the documented `RequestBody` type in the relevant module foundation
  doc match what you actually had to send to make the call work?
- For every divergence: what field was missing from the doc / present in
  your call (or vice versa)? Cite endpoint + doc line range.
- Which endpoints did you wish had a v2 fixture so you could have
  cross-checked? List by priority for v2 recapture.

This section feeds the v1 → v2 migration backlog in
`07-references/fixture-index.md` "v1 → v2 migration backlog".

## 8b. Panel management surfaces (SDD 07 expansion)
The panel includes payment-method add (using `gateway_context: "add"`),
address / phone / email / company CRUD. Report:
- Which surfaces did you build? Which did you skip?
- Did the `add` vs `buy` gateway-context distinction (paymentDetails.md
  Lessons) hold up clearly, or did you confuse the two?
- Were the missing fixture captures (POST/PUT/DELETE on payment_details,
  addresses, phones, emails — flagged as **GAP** in SDD 07's API calls
  table) blocking? Did you capture replacements?
- Did the primary-vs-secondary email distinction (primary read-only)
  match the platform's actual behaviour?

## 8c. Form autocomplete (operating principle 12)
For every form you generated (login, register, address, phone, email,
card-capture, etc.):
- Did you set the right `autocomplete` token on every input?
- Did a password manager (1Password, browser-native, Bitwarden, etc.)
  successfully save / autofill the form on validation? Quick test:
  open the form in Chrome with a password manager installed, submit,
  expect a save prompt; revisit, expect autofill suggestions.
- Any field where the documented token didn't work / was wrong?

## 8d. Interactive control state (operating principle 13)
For every button, link, or form submit the user can click:
- Did the control disable + show a pending indicator while the
  associated request was in flight?
- Did optimistic UI fire on safe mutations (qty +/-, default toggles)?
- Did skeletons render during list / detail loads?
- Did multi-step flows surface progress / step indicators?
- Did form submits show "Saving…" state + post-success confirmation?
- Did toasts appear for non-form mutations (add to basket, set default,
  delete)?
- **Test by clicking through the prototype as a real user.** If "Pay"
  doesn't visibly change while POST /payments is in flight, mark as
  a gap — the code is right but the feature isn't.

## 8e. UI design baseline (operating principle 14)
The prototype has to *look* like a cart and panel, not a debug page.
For each shipped surface, report:
- Did you use real UI primitives (cards, dropdowns, dialogs, avatars,
  skeletons, toasts) from the picked UI kit, or raw HTML?
- Did you use design-aware tooling (Figma MCP, shadcn / shadcn-vue CLI,
  magic-mcp, block patterns) when available?
- Estimated proportion of build time spent on UI / layout polish vs
  data wiring — target ~20-30%, flag if you went < 10% (probably looks
  unfinished) or > 40% (probably ate spine time).
- Would a non-developer on the team look at it and say "yeah, that's
  a cart" / "yeah, that's an account area"?

## 8f. Brand payment-policy config keys (SDD 02 + SDD 06 + SDD 07)
The brand's `billing.gateway.*` config keys shape the payment UX
significantly. Report:
- Did you read `force_card_storage`, `force_auto_payment_for_stored_details`,
  and `allow_card_removal_replacement` during bootstrap?
- Did `force_card_storage` cause the payment flow to capture a card
  on a free basket (when the test brand has the key set)?
- Did the stored card appear in `/panel/payment-methods` after a paid
  purchase (when `force_card_storage: true`)?
- Did the delete-card affordance correctly disable when
  `allow_card_removal_replacement: false`?
- Were any of these keys missing from the test brand's config response
  (over-fetching is wasteful, but missing keys produce a default the
  feature can't tell from "intentionally false")?

## 8g. Convert + payment retry behaviour (operating principle 15)
The agent now knows convert is single-use and `basket.id === invoice.id`
post-convert. Report:
- Did your payment retry path correctly skip `PATCH /orders/{id}/convert`
  when retrying against an already-converted basket?
- If a `4xx "already converted"` response was observed, did the code
  treat it as soft-success (read invoice id from state, proceed to POST
  /payments) rather than surfacing the 4xx to the user?
- Did `/payment/invoice/:invoiceId` (SDD 07 step 11) skip convert
  entirely when paying an existing unpaid invoice from the panel?
- Did `GET /api/invoices/{id}` against a pre-convert basket UUID return
  the basket as an "invoice" with `status.code` carrying `draft`, and
  did your confirmation page status-check before rendering?

## 8h. Gateway eligibility filtering (SDD 06 step 2)
The gateway list needs four filters, not one:
- Did `GET /api/brands/{id}/gateways` carry `basket_id` + `invoice_id` +
  `currency_code` + `country_code` together?
- Did the response include offline / manual / direct-debit gateways
  that returned 422 on `POST /payments` ("does not support automatic
  payments")?
- Which `gateway.<flag>` did you settle on for the
  `supportsAutomaticPayment()` predicate? Multiple field names exist;
  pin the one the workshop brand actually returns.
- Did the convert-only path for offline gateways land cleanly, or
  did the platform try to auto-progress?

## 8i. Status objects + multi-signal paid detection (operating principles 17-18)
- Did you remember `invoice.status` is an object `{ id, code, name,
  object_type }` and read `.code`? Any runtime errors from
  `invoice.status === "invoice_paid"` comparisons?
- Did the three-signal `isPaid()` predicate (status.code includes "paid"
  OR captured non-refunded non-pending payment row OR
  paid_amount_formatted === total_amount_formatted) match the badge
  the user sees on the panel invoice list?
- Was any invoice "looked paid but the predicate said unpaid" or
  vice-versa? If so, which predicate signal was wrong for this brand?

## 8j. Stripe Card Element + billing_details (SDD 06 steps 6-7)
- Did you pass `hidePostalCode: true` when mounting the Card Element?
- Did `stripe.createPaymentMethod` carry the full `billing_details`
  including the address from feature 5?
- Did Stripe reject any card with a "postal code mismatch" or
  "incorrect ZIP" error? If so, was `billing_details.address.country`
  set to ISO-2 (`"GB"` / `"US"`) rather than the country name?

## 8k. Currency switcher (newly promoted to BUILT in generic.md §3)
- Did you ship a currency switcher in the chrome (header / footer)
  reading from `brand.currencies`?
- Pre-basket: did changing currency update the foundations slot and
  affect the next catalogue read's prices?
- Post-basket: did changing currency fire `PUT /orders/{basketId}/currency`
  and re-price the basket? Did the response carry the wide `?with=` expand?
- Was the switcher debounced client-side? Rapid USD → GBP → EUR
  switches should fire at most one PUT.

## 8l. Platform query conventions (foundations §1.2)
- Did you use `filter[field.subfield]` dotted-path filter syntax for
  any reads (`filter[status.code]`, `filter[category.slug]`)?
- Did you use `limit=count` for stat-card count reads?
- Did you use `skip_count=1` on list reads where total isn't needed?
- Did you use `with_count=<relation>` to avoid expanding a full
  relation when you only need its count?
- Any wire-format gaps where these conventions didn't behave as the
  foundations chapter described?

## 9. Tooling gaps
Tools, integrations, or capabilities you wished you had but didn't:
- MCP servers that would have helped (Postgres-against-staging? Stripe
  sandbox poker? Linear for capturing gaps?)
- Background-agent / subagent capabilities you wanted but couldn't access
- IDE / Claude Code features that would have changed the loop
- Anything else infrastructural

Skip this section if nothing is missing.

## 10. The single highest-impact change
If I can only make one change to the bundle before the next workshop, what
should it be? One paragraph. Be specific — name the file and the section.

## 11. Open questions I couldn't answer
Things that came up during the workshop that you (the agent) genuinely
didn't know how to handle, and that no doc in the bundle clarified. List
them — these are where the next iteration of the docs needs to grow.

# Tone

- Direct. State the finding, not your feelings about it.
- Specific. Cite file paths, section numbers, line ranges, endpoint names.
  "SDD 06 §3.2 was unclear about X" beats "payment was confusing".
- Quantified where possible. "Took 90 min vs the 60 min estimate" beats
  "took longer than expected".
- If you've forgotten a detail, say so — don't reconstruct.

# Delivery

When the retro is written:

1. Save it to `workshop-bundle/RETRO-<YYYY-MM-DD>.md` in this repo using
   the Write tool. Use today's date in the filename.
2. Commit it: `git add workshop-bundle/RETRO-*.md && git commit -m "docs:
   workshop retro <date>"`.
3. Output the retro as your message to me as well, so I can read it in
   chat.

Don't ask me clarifying questions first; the prompt above is the brief.
After you deliver the retro, I'll follow up if I need expansion on
anything.
````

---

## What to do with the retro afterwards

Bring the retro back to the bundle maintainer (Upmind side). Common follow-ups:

- **Section 4 findings → SDD edits.** Each "endpoint reality check" or "missing edge case" lands as a direct edit to the SDD in question. Update the validation checklist if a new edge case warrants it.
- **Section 5 findings → operating principles.** If a hard rule was repeatedly violated, sharpen its wording in `generic.md` §10. If it was never tested, consider whether it's earning its place.
- **Section 8 → bundle revisions.** "Things that were never opened" → trim. "Things flat wrong" → fix. "Things missing" → add.
- **Section 10 (highest-impact change)** → top of the maintainer's next revision PR.
- **Section 11 (open questions)** → new sections in foundation docs or a new FAQ doc, depending on volume.

Compare retros across runs to spot patterns. A finding flagged once is a one-off; a finding flagged in three out of four retros is a load-bearing gap.
