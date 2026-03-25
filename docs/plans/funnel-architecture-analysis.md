# Funnel System — Conceptual Analysis

> A deep dive into what works, what's awkward, what's missing, and how other systems solve the same problems.

**Date:** March 2026
**Authors:** Dominic da Costa
**Related ADRs:** [017 — Funnel Navigation via State Meta](../adr/017-funnel-navigation-via-state-meta.md), [018 — Funnel Reactive Watchers](../adr/018-funnel-reactive-watchers.md)
**Related Stories:** [FE-2546](https://linear.app/upmind-automation/issue/FE-2546) (Reactive Watchers), [FE-2581](https://linear.app/upmind-automation/issue/FE-2581) (Overlay Guarding)

---

## What the Funnel System Actually Is

Strip away the code and the system has three layers:

1. **Routing Engine** — the orchestrator. Knows which funnel to load, forwards events, handles funnel chaining.
2. **Funnel Machine** — the factory. Produces a state machine from a config (states, guards, services, actions). Every route is a state node.
3. **Funnel Config** — the definition. App-level (e.g. `cart.ts`). Declares the states, the guard services, and the NEXT/BACK transitions.

The core loop is:

```
Route change → RESOLVE event → guard match → invoke service → onDone/onError → resolved/redirect
```

---

## What's Good

### 1. Route-as-State is a Powerful Model

Every route is a state node with a guard service. This is genuinely elegant — it means:
- You can't be on a page without being validated for it
- The machine knows WHERE you are and WHERE you can go
- Route transitions are explicit and auditable (show up in state charts)

This is **better than route guards** because guards run in isolation (each guard only knows about itself). The funnel knows the FULL picture — all states, all transitions, the history of where you've been.

### 2. Clean Separation of Concerns

- **Headless** (`funnel.machine.ts`) — framework-agnostic factory. Knows nothing about basket, auth, products.
- **App** (`cart.ts`) — domain-specific config. Declares "basket requires products, checkout requires auth."
- **Services** (`services.ts`) — async logic. Actually checks conditions and returns results.

A different app (portal, admin) can use the same factory with completely different states.

### 3. The RESOLVE/setResolved Contract

Simple and effective: `resolved: false` means "still deciding," `resolved: true` means "this page is valid, render it." The routing engine watches for this via `awaitResolved` and only navigates once the funnel gives the green light.

### 4. Dynamic Injection

`useFunnelMachine` generates guards from state keys. This means adding a new route to the funnel config is literally just adding a state object — the wiring is automatic. Zero boilerplate.

---

## What's Awkward

### 1. NEXT/BACK Are Hardcoded Per-State, Not a Graph

Look at how NEXT/BACK work in `cart.ts`:

```typescript
[ROUTE.CATALOGUE]: {
  on: {
    NEXT: { target: ROUTE.RECOMMENDATIONS, actions: [assign({ targetRoute: { name: ROUTE.RECOMMENDATIONS } })] },
    BACK: { target: ROUTE.BASKET, actions: [assign({ targetRoute: { name: ROUTE.BASKET } })] }
  }
}
```

**Every single state** manually declares its NEXT and BACK targets. This is:

- **Repetitive** — 20+ states each with NEXT/BACK, many with identical patterns
- **Fragile** — add a state between two existing ones and you have to update two neighbours
- **Inconsistent** — some states have NEXT/BACK, some don't, some handle them differently
- **Duplicated logic** — the `assign({ targetRoute: { name: X } })` pattern repeats ~40 times

> **Resolution:** [ADR 017](../adr/017-funnel-navigation-via-state-meta.md) proposes using XState's native `meta` property to declare `next`/`prev` on state nodes. The factory auto-generates NEXT/BACK handlers.

### 2. `setResolving` Clears `targetRoute` — This Is Dangerous

```typescript
setResolving: assign({
  resolved: false,
  targetRoute: undefined  // ← PROBLEM
})
```

States are working AROUND `setResolving` instead of with it. The action conflates two things:
- "We're not resolved yet" (`resolved: false`)
- "Forget where we're going" (`targetRoute: undefined`)

Cart's workarounds: inline `assign({ resolved: false })` or full custom `assign` blocks that preserve targetRoute while setting resolved to false.

### 3. `setResolved` Does Too Much (and Is Overridden)

The headless `setResolved` assigns `resolved: true` AND computes `targetRoute`. But the cart app *overrides it* with its own version that also handles bid params. The headless version becomes dead code. Other apps would have to copy-paste the base logic and add their own line.

### 4. Guards Spread Before Auto-Gen (Inconsistent)

Guards and actions use opposite spread order. Consumer-provided guards get overridden by auto-gen guards. Consumer-provided actions override defaults. This asymmetry is accidental.

### 5. The RESOLVE Fallback Is Silent

Any unknown route resolves successfully to idle. The funnel says "I don't know this route, but sure, go ahead." No logging, no warning, no way for the app to know.

### 6. `awaitResolved` Reads State Names as Route Names

If `targetRoute` has no `name`, it falls back to the XState state name. This couples state names to route names by convention, not contract.

### 7. NEXT/BACK at Funnel Level Silently Hang

The funnel-level NEXT/BACK handlers just set `resolved: false`. If the current state doesn't handle NEXT/BACK, `awaitResolved` waits forever.

---

## What's Missing

### 1. No Step/Progress Model

The funnel has no concept of "where am I in the flow?" or "how far along am I?" Every state is equal — no distinction between "step 1 of 5" and "error page."

### 2. No History / Breadcrumb

No **history stack**. Can't answer "where did I come from?" or "what's the last valid state?" Deep-linking skips the happy path, so "previous" isn't the declared BACK target.

### 3. No Conditional Flow / Decision Nodes

No first-class concept of "if X go to A, else go to B." Transitional states (states with `always` or immediate `invoke`) are fragile workarounds.

### 4. No Error Recovery Strategy

Guard fails → fallback redirect. No retry, no "show error and retry," no graceful degradation.

### 5. No Event Bus / Side-Effect System

No way for a guard's result to trigger side effects beyond "transition to this state." The cart works around this with entry actions (`setCurrency`, `setBasket`) that fire every time the state is entered.

### 6. No Type Safety on State Transitions

NEXT/BACK targets are strings. `target: ROUTE.DOES_NOT_EXIST` compiles fine.

### 7. No Reactive State Watchers (FE-2546)

This is perhaps the **biggest conceptual gap**. The funnel is purely **route-driven** — it only acts when a route change triggers a RESOLVE event. But real user flows need **state-driven** reactions too.

Right now, `App.vue` contains imperative watchers that bypass the funnel entirely:

```typescript
// App.vue — ad-hoc watchers OUTSIDE the funnel
watch([basketMeta, sessionMeta], ([basket, session], [prevBasket, prevSession]) => {
  if (!routingMeta.value.isResolved) return;

  // Logout → redirect to session-end
  if (!session.isAuthenticated && prevSession.isAuthenticated) {
    return router.push({ name: ROUTE.SESSION_END });
  }

  // Basket unavailable → redirect
  if (basket.isUnavailable && !prevBasket.isUnavailable && session.isAuthenticated) {
    return router.replace({ name: ROUTE.BASKET_UNAVAILABLE });
  }

  // Basket emptied → redirect to empty page
  if (!basket.hasProducts && prevBasket.hasProducts && !basket.isCheckout && !basket.isComplete) {
    if (route.meta.actionEmptyBasket) return router.push({ name: ROUTE.BASKET_EMPTY });
  }
});
```

**Why this is a problem:**
- These watchers call `router.push()` **directly**, bypassing the funnel's resolution pipeline
- They live in **app-level components**, not in the routing architecture
- They duplicate routing logic — the funnel defines SESSION_END as a state, but the watcher navigates there imperatively
- They check `routingMeta.value.isResolved` manually for mutual exclusion — a concern that belongs in the funnel
- Every app (cart, cart-nuxt, portal) must independently copy these watchers

**FE-2546's solution:** Register watchers alongside funnels. The funnel machine subscribes to state changes (session, basket) and triggers navigation through the existing RESOLVE pipeline — not direct `router.push()`. Watchers are blocked when `context.resolved === false`, giving automatic mutual exclusion.

This transforms the funnel from a **reactive-to-routes** system into a **reactive-to-state** system. Route changes AND state changes both flow through the same resolution pipeline.

> **This is the single most important missing piece.** Routes are only ONE trigger for navigation. Business state changes (logout, basket emptied, subscription expired) are equally important. The funnel should own ALL navigation triggers, not just route changes.

> **Resolution:** [ADR 018](../adr/018-funnel-reactive-watchers.md) formalises the watcher subscription pattern.

### 8. Routing Outside of a RESOLVE Flow

There's a subtle but critical problem: **what happens when something needs to navigate but there's no active RESOLVE cycle?**

The funnel is built around the RESOLVE loop — `router.beforeEach` triggers RESOLVE, which runs a guard, which sets `resolved: true`, which lets `awaitResolved` complete and push to the router. But some navigation needs aren't initiated by `router.beforeEach`:

- **Watchers** — session expires mid-page. No route change happened. The watcher needs to start a navigation from scratch.
- **Child machine completion** — a payment machine finishes. The parent needs to navigate to the next step.
- **Programmatic navigation** — `useRoutingEngine().navigate()` is called from a button click.

In all these cases, the caller wants to navigate but the funnel is sitting idle (resolved, not expecting a RESOLVE). The current flow:

```
1. caller calls navigate({ name: ROUTE.CHECKOUT })
2. navigate() calls router.push()
3. router.beforeEach fires
4. beforeEach calls funnel.send("RESOLVE", { route })
5. funnel runs guard → sets resolved: true
6. awaitResolved completes → router.push() goes through
```

This works but is **fragile**:
- Between step 1 and step 3, the funnel is still `resolved: true` from the previous cycle — a watcher could fire and create a race
- If the route doesn't change (e.g. navigating to same page with different query), `router.beforeEach` doesn't fire and the funnel never resolves
- There's no way for the caller to know if their navigation was rejected by a guard — `navigate()` is fire-and-forget

**What better looks like:** `navigate()` should set `resolved: false` BEFORE calling `router.push()`, closing the race window. And it should return a promise that resolves when the funnel completes resolution — so callers know whether their navigation succeeded.

### 9. Developer Experience (DX) Pain Points

The funnel system is powerful but **hard to consume, define, and debug**:

**Consumption:**
- `useRoutingEngine()` exposes `navigate`, `back`, `next` — but the relationship between these and the funnel's NEXT/BACK/RESOLVE events is non-obvious
- When a navigation fails (guard rejects), there's no feedback to the caller. The funnel silently redirects elsewhere.
- `isResolved`, `isResolving`, `isLoading` — the meta flags exist but their interplay is unclear

**Definition:**
- Writing a new funnel config requires understanding the RESOLVE → guard → setResolved pipeline, the guard spread order, the action spread order, and the entry/invoke patterns. This is undocumented.
- A new developer's first funnel state typically takes 2-3 attempts because they don't know:
  - Which actions to include (`setResolving`, `setResolved`, `setCurrentRoute`, `setTargetRoute`)
  - When to use `entry` vs `invoke.onDone` for side effects
  - How to handle the NEXT/BACK pattern correctly
  - That `assign({ targetRoute })` must accompany the `target` transition

**Debugging:**
- When a route resolves unexpectedly, the developer has to:
  1. Open XState devtools
  2. Find the funnel machine (among 10+ machines)
  3. Trace the RESOLVE event
  4. Check which guard matched (or if the fallback to idle fired)
  5. Check the guard service's resolution
  6. Check whether `setResolved` or a custom action set the targetRoute
- There's no logging, no breadcrumb trail, no "why did I end up here?" diagnostic
- The silent idle fallback means bad route configs produce subtle bugs, not errors

**What better looks like:**

1. **Builder API for funnel configs** — instead of raw XState config objects, a fluent API that validates at definition time:
   ```typescript
   createFunnelConfig("cart")
     .addStep(ROUTE.CATALOGUE, { guard: "guardCatalogue", next: ROUTE.BASKET })
     .addStep(ROUTE.BASKET, { guard: "guardBasket", next: ROUTE.CHECKOUT, prev: ROUTE.CATALOGUE })
     .addDecision(ROUTE.CHECKOUT_FLOW, { guard: "guardCheckoutFlow", routes: { basket: ROUTE.BASKET, checkout: ROUTE.CHECKOUT } })
     .build();  // validates all targets exist, all guards are declared
   ```
2. **Dev-mode diagnostics** — log guard resolutions, warn on idle fallback, trace the full RESOLVE → navigate path
3. **Typed navigation results** — `navigate()` returns `Promise<{ resolved: boolean, target: string, guardResult?: any }>`
4. **Funnel state inspector** — a dev panel showing: current state, history, active watchers, pending guard

---

## How Other Systems Solve These Problems

### Problem 1: NEXT/BACK Navigation

> *"How do you define the order users move through a flow?"*

#### Our Approach: Per-State Explicit Targets

Each state hardcodes its NEXT and BACK targets. ~40 repetitive `assign({ targetRoute: { name: X } })` blocks.

#### Shopify Checkout: Ordered Step Enum

Shopify exposes `Shopify.Checkout.step` — an enum of `contact_information → shipping_method → payment_method → processing → thank_you`. The checkout knows what step you're on, what's next, and what's previous. Progress bars are computed from position in the sequence.

The key insight: **the happy path is a sequence, not a graph**. Branching is the exception, not the rule.

**Our solution ([ADR 017](../adr/017-funnel-navigation-via-state-meta.md)):** Use XState's native `meta` property on state nodes to declare `next`/`prev`. The factory reads meta at creation time and auto-generates NEXT/BACK handlers. `meta` is a first-class XState feature — not a custom property bolted on.

```typescript
// Instead of 40+ per-state NEXT/BACK declarations:
[ROUTE.CATALOGUE]: {
  meta: { next: ROUTE.RECOMMENDATIONS, prev: ROUTE.BASKET, step: 1, label: "Catalogue" },
  invoke: { src: "guardCatalogue", onDone: ..., onError: ... }
  // NEXT/BACK handlers auto-generated by the factory!
}

// States with conditional NEXT still use explicit handlers (override meta):
[ROUTE.CHECKOUT_FLOW]: {
  meta: { step: 4, label: "Checkout", decision: true },
  on: {
    NEXT: [
      { target: ROUTE.BASKET, cond: "isBasket" },
      { target: ROUTE.CHECKOUT, cond: "isCheckout" }
    ]
  }
}
```

**Why `meta` over a custom `sequence` array:**
- `meta` is native XState — no custom schema
- `meta` shows in XState Inspector / state charts — making navigation visible
- `meta` survives the v5 migration (renamed to `state.getMeta()`)
- `meta` is per-state, so non-linear states (error pages, decision nodes) can opt out
- Each state owns its own navigation declaration — no separate array to keep in sync

#### Formkit Multi-Step: Computed Navigation

[Formkit's multi-step plugin](https://formkit.com/plugins/multi-step) defines steps as an ordered array. `previous()` and `next()` are computed from position. Steps can be conditionally included/excluded. Progress is `currentIndex / steps.length`.

**What we could steal:** With `meta.step` on state nodes, we can compute `currentStep`, `totalSteps`, `progress`, `isFirst`, `isLast`, `canGoNext`, `canGoBack` — all from meta.

#### XState Catalogue Wizard Pattern

The [XState Catalogue wizard](https://xstate-catalogue.com/machines/multi-step-form) defines a parallel machine where each step is a child state. Navigation is `CONFIRM` → next state, `BACK` → previous state. But crucially, the transitions are still explicit per-state — same problem we have.

**Observation:** Even canonical XState examples don't solve the NEXT/BACK repetition problem. Our `meta`-based approach fills a gap in the XState ecosystem itself.

---

### Problem 2: Route Guarding / Access Control

> *"How do you decide if a user can see a page?"*

#### Our Approach: Invoke Guard Service

Each state `invoke`s a guard service (async). `onDone` = allowed, `onError` = redirect. This is powerful because guards can do async work (API calls, wait for state machines).

#### Angular: Composable CanActivate Guards

Angular's route config accepts an **array** of guard functions:

```typescript
{
  path: 'checkout',
  canActivate: [authGuard, basketGuard, billingGuard],
  component: CheckoutComponent
}
```

Each guard returns `boolean | UrlTree | Promise<boolean>`. If ANY guard returns false or a UrlTree (redirect), navigation is blocked. Guards compose — you don't need a monolithic `guardCheckout` that checks auth AND basket AND billing.

**What's better about this:** Composition. Our `guardCheckout` service does multiple things: checks auth, checks basket products, checks billing. If you want to reuse just the auth check for another route, you can't — you have to create a new service. Angular lets you stack independent guards.

**What we could steal:** Allow `invoke` to accept an array of guard services. All must pass for `onDone`. First failure triggers `onError` with the failing guard's data.

```typescript
[ROUTE.CHECKOUT]: {
  invoke: {
    src: ["guardSession", "guardBasketProducts", "guardBilling"],
    onDone: { actions: ["setResolved"] },
    onError: [/* branching based on WHICH guard failed */]
  }
}
```

#### Remix/React Router: Loader Pattern

Remix treats each route as a full-stack component. The `loader` function runs server-side before the component renders. If the loader throws a `redirect()`, the user never sees the page. Data from the loader is available to the component via `useLoaderData()`.

```typescript
export async function loader({ request }) {
  const user = await requireAuth(request);        // throws redirect if not authed
  const basket = await getBasket(user.id);         // load data
  if (basket.items.length === 0) throw redirect('/catalogue');
  return json({ basket });                         // data available to component
}
```

**What's better about this:** The guard and the data loading are the same operation. In our system, `guardBasket` checks products AND returns data, but the component can't access the guard's return value. The data check and the data loading are separate operations that happen to overlap.

**What we could steal:** Guard services could return data that's available in the funnel context. Not just "pass/fail" but "here's what I loaded":

```typescript
// Guard service returns data
async function guardBasket(context) {
  const basket = await loadBasket();
  if (isEmpty(basket.products)) throw new Error("empty");
  return { basket };  // available in context.guardData
}
```

---

### Problem 3: Conditional Branching

> *"How do you handle 'if X then go to A, else go to B'?"*

#### Our Approach: Transitional States

States with `always` or `invoke` that immediately redirect. The state has no UI — it's purely a routing decision. Example: `CHECKOUT_FLOW` checks a brand setting and routes to BASKET or CHECKOUT.

#### AWS Step Functions: Choice State

Step Functions has a first-class `Choice` state type:

```json
{
  "Type": "Choice",
  "Choices": [
    {
      "Variable": "$.paymentStatus",
      "StringEquals": "approved",
      "Next": "ProcessPayment"
    },
    {
      "Variable": "$.paymentStatus",
      "StringEquals": "rejected",
      "Next": "RejectOrder"
    }
  ],
  "Default": "PendingReview"
}
```

Key features:
- **Declarative conditions** — conditions are data, not code
- **Default fallback** — always has a default, preventing silent hangs
- **Order matters** — first match wins, like our guard arrays
- **No side effects** — Choice states ONLY route, they never do work

**What's better about this:** The intent is explicit. Our transitional states look like regular states but behave differently. A developer reading the config can't tell at a glance that `CHECKOUT_FLOW` is a decision node, not a page.

**What we could steal:** A `decision` state type decorator:

```typescript
[ROUTE.CHECKOUT_FLOW]: {
  type: "decision",  // signals: "this is not a page, it's a routing decision"
  invoke: {
    src: "guardCheckoutFlow",
    choices: [
      { cond: "isBasket", target: ROUTE.BASKET },
      { cond: "isCheckout", target: ROUTE.CHECKOUT }
    ],
    default: ROUTE.BASKET
  }
}
```

#### BPMN (Business Process Model and Notation): Gateways

BPMN has explicit gateway types:
- **Exclusive Gateway** (XOR) — exactly one path
- **Inclusive Gateway** (OR) — one or more paths
- **Parallel Gateway** (AND) — all paths simultaneously

Our transitional states are essentially unlabelled exclusive gateways. The concept exists but isn't named.

---

### Problem 4: Action/Effect Composition

> *"How do you let apps extend behaviour without replacing it?"*

#### Our Approach: Override by Spread

Apps override `setResolved` by providing their own action with the same name. The app has to copy the entire base implementation and modify it.

#### Express/Koa: Middleware Stacks

```javascript
app.use(authenticate);     // runs first
app.use(loadBasket);        // runs second
app.use(injectBidParams);   // runs third — can modify what previous middleware set
```

Each middleware can modify the request/response and call `next()` to pass control. No need to copy the entire chain — you add your concern to the stack.

#### Angular: Guard Composition (again)

Angular guards compose naturally. If you want to add bid-param injection to every route, you add a guard to the array — you don't replace the existing auth guard.

**What we could steal:** Action hooks. Instead of overriding `setResolved`, apps register hooks:

```typescript
// Headless provides the base
actions: {
  setResolved: assign({ resolved: true, targetRoute: computeTarget })
}

// App extends it
hooks: {
  afterSetResolved: (context) => {
    // Inject bid params after the base action runs
    context.targetRoute = resolveBidParams(context.targetRoute);
  }
}
```

This is similar to XState v5's action composition with `enqueueActions`.

---

### Problem 5: History / Navigation Stack

> *"How do you know where the user has been?"*

#### Our Approach: No History

`currentRoute` and `targetRoute` only. No stack, no breadcrumb.

#### Browser History API: Stack-Based

The browser maintains a history stack. `back()` pops. `pushState()` pushes. `replaceState()` modifies the top. Simple, battle-tested.

#### XState: History States

XState has built-in [history states](https://xstate.js.org/docs/guides/history.html) — `type: "history"` nodes that remember and return to the last active child state. Useful for "go back to whatever I was doing before this interruption."

**What we could steal:** The funnel could maintain a `history: string[]` in context. Every transition pushes the current state. BACK pops. Deep-links start with an empty history, so BACK degrades to the declared fallback (current behaviour) instead of crashing.

```typescript
// Context
{ history: ["catalogue", "basket"], currentRoute: "checkout" }

// BACK → pops "basket" from history, navigates there
// If history is empty → falls back to declared BACK target
```

---

### Problem 6: Progress / Step Tracking

> *"How far along is the user?"*

#### Our Approach: Nothing Built-In

States are equal. The consumer would have to manually determine progress from the current state name.

#### Shopify Checkout: Step Enum + Progress

```javascript
Shopify.Checkout.step       // "payment_method"
Shopify.Checkout.page       // "show"
// Progress bar computed: step 3 of 5 = 60%
```

#### Stripe Checkout Sessions: Server-Driven Status

```json
{
  "status": "open",          // or "complete", "expired"
  "payment_status": "paid",  // or "unpaid", "no_payment_required"
  "total_details": { ... }
}
```

Stripe doesn't expose step numbers — it exposes **status**. The session either needs action or it doesn't. This is closer to our `resolved` boolean but richer.

#### Multi-Step Form Libraries: First-Class Progress

Every wizard library (Formkit, React Multi-Step Form, React Final Form Wizard) provides:
- `currentStep: number`
- `totalSteps: number`
- `progress: number` (0-1)
- `isFirst: boolean`
- `isLast: boolean`
- `canGoNext: boolean`
- `canGoBack: boolean`

**What we could steal:** If we add a `sequence` to FunnelProps, progress is trivially computed:

```typescript
const progress = computed(() => {
  const idx = sequence.indexOf(currentState);
  return idx === -1 ? 0 : idx / (sequence.length - 1);
});

const meta = computed(() => ({
  currentStep: sequence.indexOf(currentState),
  totalSteps: sequence.length,
  progress: currentStep / (totalSteps - 1),
  isFirst: currentStep === 0,
  isLast: currentStep === totalSteps - 1,
  canGoNext: !isLast && resolved,
  canGoBack: !isFirst
}));
```

---

### Problem 7: Error Recovery

> *"What happens when something goes wrong?"*

#### Our Approach: Redirect to Fallback

Guard fails → onError → hard redirect to BASKET (or whatever). No retry, no context about what failed.

#### AWS Step Functions: Retry Policies

```json
{
  "Retry": [
    {
      "ErrorEquals": ["NetworkError"],
      "IntervalSeconds": 2,
      "MaxAttempts": 3,
      "BackoffRate": 2.0
    }
  ],
  "Catch": [
    {
      "ErrorEquals": ["States.ALL"],
      "Next": "HandleError"
    }
  ]
}
```

Step Functions retry automatically with exponential backoff. Only after max attempts does it fall to the Catch (error handler).

#### Temporal.io: Workflow-Level Retry

Temporal takes this further — entire workflows can be retried, and individual activities within workflows have independent retry policies. Failed activities can be inspected and replayed.

**What we could steal:** Guard retry with timeout:

```typescript
[ROUTE.CHECKOUT]: {
  invoke: {
    src: "guardCheckout",
    retry: { maxAttempts: 2, delay: 1000 },  // retry once after 1s
    onDone: { actions: ["setResolved"] },
    onError: { target: ROUTE.BASKET }         // only after retries exhausted
  }
}
```

This could be implemented in the factory — wrap guard services in retry logic before passing to XState.

---

### Problem 8: Data Loading Tied to Route

> *"How do routes declare what data they need?"*

#### Our Approach: Entry Actions (Blunt)

```typescript
[ROUTE.BASKET]: {
  entry: ["setCurrency", "setBasket"],  // fire-and-forget on every entry
  invoke: { src: "guardBasket", ... }
}
```

Entry actions are synchronous side effects that fire every time the state is entered. They can't fail, they can't be awaited, and they fire even if the guard will immediately redirect you away.

#### Remix: Loaders as Data Dependencies

Each route declares its data needs as a function. The framework runs all loaders before rendering. If a loader fails, the error boundary catches it. The component doesn't render until data is ready.

**What's better:** Data loading is lazy (only runs when the route is active), declarative (the route says WHAT it needs, not HOW to get it), and failsafe (errors are handled).

**What we could steal:** Guard services could serve double-duty — they're already async functions that run before the route renders. If we made their return data available in context (`guardData`), we'd have Remix-style data loading without a new concept.

---

### Problem 9: Reactive State Watching

> *"How does the funnel react to business state changes (e.g., session expiry, basket empty)?"*

#### Our Approach: Ad-hoc in App.vue

Currently, the funnel only reacts to route changes. Business state changes that require navigation (e.g., session expiry, basket becoming empty) are handled by imperative `router.push()` calls scattered throughout `App.vue` or other components.

#### Angular: Service Watchers

Angular applications often use services to subscribe to state changes (e.g., from NgRx stores or RxJS subjects). These services can then imperatively trigger navigation using `Router.navigate()`.

#### Remix: Revalidation

Remix has mechanisms like `revalidate` and `useRevalidator` that allow components to trigger re-fetching of data based on external state changes, which can then lead to redirects if the data indicates a new route is needed.

#### AWS Step Functions: EventBridge Triggers

Step Functions can be triggered by events from AWS EventBridge, allowing external systems or state changes to initiate or modify workflow execution.

**What we could steal:** Funnel watcher subscriptions (FE-2546). The funnel subscribes to specific business state changes and triggers its resolution pipeline when those states change.

> **Resolution:** [ADR 018](../adr/018-funnel-reactive-watchers.md) formalises the watcher subscription pattern.

---

## Summary: Upmind Funnel vs The Field

| Capability | Upmind Funnel | Angular | Remix | AWS Step Functions | Shopify | Wizard Libraries |
|-----------|--------------|---------|-------|-------------------|---------|-----------------| 
| Route guarding | ✅ Invoke service | ✅ CanActivate array | ✅ Loader throws | N/A | Implicit | N/A |
| Guard composition | ❌ Monolithic | ✅ Guard arrays | ⚠️ Compose inside loader | N/A | N/A | N/A |
| Sequential nav | ❌ Per-state hardcoded | ❌ Manual | ❌ Manual | ✅ `Next` field | ✅ Step enum | ✅ Step array |
| Conditional branching | ⚠️ Transitional states | ⚠️ Guard returns UrlTree | ⚠️ Loader redirect | ✅ Choice state | ❌ Fixed flow | ⚠️ Conditional steps |
| Progress tracking | ❌ None | ❌ None | ❌ None | ⚠️ Via CloudWatch | ✅ Built-in | ✅ Built-in |
| History / back stack | ❌ None | ❌ Browser only | ❌ Browser only | ❌ None | ❌ None | ⚠️ Some libs |
| Error retry | ❌ Hard redirect | ❌ None | ⚠️ ErrorBoundary | ✅ Retry policies | ❌ None | ❌ None |
| Action composition | ❌ Override by spread | ✅ Interceptors | ✅ Middleware | ✅ Catch + retry | N/A | N/A |
| Data from guard | ❌ Ignored | ⚠️ Resolver | ✅ useLoaderData | ✅ Output to next state | N/A | N/A |
| Type-safe transitions | ❌ String targets | ⚠️ Partial | ✅ Type-safe routes | ✅ JSON schema | N/A | ⚠️ Some libs |
| **Reactive state watches** | ❌ Ad-hoc App.vue | ⚠️ Service watchers | ⚠️ Revalidation | ✅ EventBridge triggers | ❌ None | ❌ None |

**Key takeaways:**
- We're **strongest** at the thing nobody else does well: full-flow state machine guarding with cross-state awareness
- We're **weakest** at the things most systems get for free: sequential navigation, progress tracking, guard composition
- The **most critical gap** is reactive state watching — the funnel only reacts to routes, not to business state changes (FE-2546 addresses this)
- The **biggest opportunities** are ideas we can steal without breaking the architecture: state meta navigation ([ADR 017](../adr/017-funnel-navigation-via-state-meta.md)), watcher subscriptions ([ADR 018](../adr/018-funnel-reactive-watchers.md)), guard data in context, history stack

---

## Priority Ranking: What Would Have the Most Impact?

### Tier 1: In-Flight (Already Planned)

1. **Reactive state watchers (FE-2546)** — the single most impactful change. Transforms the funnel from route-reactive to state-reactive. Already designed and planned.
2. **Funnel overlay guarding (FE-2581)** — overlay routes flow through the resolution pipeline instead of component-level watchers. Already in SDD.

### Tier 2: Quick Wins (Improve DX Now)

3. **Fix guard spread order** — 1 line change, prevents confusion
4. **Separate `setResolving` concerns** — stop clearing `targetRoute` unconditionally
5. **Add idle fallback detection** — meta/flag so apps know when the funnel punted
6. **Pre-resolve locking for `navigate()`** — set `resolved: false` before `router.push()` to prevent watcher races

### Tier 3: Architecture Improvements (Next Major)

7. **Declarative NEXT/BACK via state meta** ([ADR 017](../adr/017-funnel-navigation-via-state-meta.md)) — eliminate 40+ duplicate `assign` patterns using XState's native `meta`
8. **Route history stack** — enable proper BACK behavior and breadcrumbs. Steal from browser History API.
9. **Action composition** — let apps hook INTO `setResolved` instead of replacing it. Steal from Express middleware.
10. **Guard data in context** — guard services return data that's available to the component. Steal from Remix loaders.
11. **Typed navigation results** — `navigate()` returns `Promise<{ resolved, target, guardResult }>` instead of fire-and-forget

### Tier 4: Vision (Future System)

12. **Step/progress model** — first-class progress tracking from `meta.step`. Steal from wizard libraries.
13. **Decision nodes** — `meta.decision: true` marks routing-only states. Steal from AWS Step Functions Choice state.
14. **Guard composition** — chain guards instead of monolithic services. Steal from Angular CanActivate arrays.
15. **Builder API for funnel configs** — fluent API that validates targets/guards at definition time
16. **Dev-mode diagnostics** — guard resolution logging, idle fallback warnings, RESOLVE breadcrumb trail
17. **XState v5 migration** — typed events, better actor model, enqueueActions for action composition.

---

## The Bigger Picture: FE-2546 + FE-2581 Together

These two stories are two sides of the same coin. Together they close the two biggest gaps in the funnel:

| Gap | Story | What it fixes |
|-----|-------|---------------|
| **Funnel is blind to overlay routes** | FE-2581 | Endpoint states give the funnel awareness of overlay routes |
| **Funnel is blind to state changes** | FE-2546 | Watcher subscriptions give the funnel awareness of business state changes |

After both land, the funnel becomes the **single source of truth** for ALL navigation:
- Route changes → RESOLVE pipeline (existing)
- Overlay deep-links → endpoint guards (FE-2581)
- Business state changes → watcher subscriptions (FE-2546)

No more `router.push()` calls scattered across `App.vue`. No more component-level auth watchers. The funnel owns all navigation triggers and routes them through the same resolution flow.

### What this enables

1. **Cross-cutting navigation policies** — "whenever session ends, redirect" is defined ONCE in a watcher, not copied across apps
2. **Mutual exclusion for free** — watchers are blocked when `resolved === false`, preventing race conditions between route resolution and state watchers
3. **Testable navigation** — watcher triggers can be unit-tested against the funnel machine, not against component lifecycle
4. **App-agnostic watchers** — watchers are registered alongside funnel configs, so portal/cart/admin can share or customize independently

### Connection to other improvements

Once FE-2546 lands, several other improvements become simpler:

- **History stack** — watchers should push to history when they trigger a redirect (so BACK works after a forced redirect)
- **Guard data** — watcher guards could use the same guard service API, composing with existing guards
- **Progress model** — watcher-triggered redirects (basket emptied → back to step 1) should reset progress tracking

---

## Summary

The funnel system's core model (route-as-state with guard services) is genuinely unique and powerful. The main gaps fall into three categories:

1. **Trigger gap** — the funnel only reacts to route changes, not business state changes. Fixed by [ADR 018](../adr/018-funnel-reactive-watchers.md) (FE-2546).
2. **Declaration gap** — NEXT/BACK is tediously repetitive. Fixed by [ADR 017](../adr/017-funnel-navigation-via-state-meta.md) using XState's native `meta`.
3. **DX gap** — defining, consuming, and debugging funnels is harder than it should be. Addressed by the builder API (Tier 4), typed navigation results (Tier 3), and dev-mode diagnostics (Tier 4).

After FE-2546 + FE-2581 + ADR 017 all land, the funnel becomes the single source of truth for ALL navigation — route changes, overlay deep-links, business state changes, and NEXT/BACK progression — all flowing through one resolution pipeline.
