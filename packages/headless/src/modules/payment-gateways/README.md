# payment-gateways Module

Drives any payment provider — a card SDK, an offsite redirect, a raw card form, an offline instruction, a wallet — through one contract, so nothing else in the codebase ever has to ask "which gateway is this?" before deciding what to do next.

## What Is This? (ELI5)

Think of it as a universal remote for payment providers. Every provider has its own buttons, its own quirks, its own way of saying "yes" or "no" — this module hides all of that behind one set of buttons: load, draw a form if there is one, capture what the client types, submit. Whether the provider behind the remote is Stripe, a bank-transfer instruction, or a raw card form makes no difference to whoever is holding the remote.

- **Load** = fetch whatever a provider needs before it can be driven (its SDK, its settings, its own setup token).
- **Draw** = mount a provider's own hosted form, only for the providers that have one.
- **Capture** = record what the client types without asking the provider to do anything yet.
- **Submit** = ask the provider to act on what was captured — pay, or store a method for later.

> **🧪 For Testers:** every scenario this module promises lives in `__tests__/payment-gateways.feature` — 39 scenarios across five groups (the shared lifecycle every gateway honours, paying, storing a method, the different ways a gateway is driven, and a gateway that can't serve the request). See [gotchas.md](./docs/gotchas.md) for what one of those scenarios is still owed, and why.
>
> **👩‍💻 For Developers:** you almost never spawn a gateway yourself. The sibling capture module spawns the chosen one as a child and hands you a lens onto it — that lens is `usePaymentGateway`, and it is the only thing this module exports.

## Quick Start

```typescript
import { usePaymentGateway } from "@upmind-automation/headless";

// `actor` is a gateway already spawned by the capture module — see Usage.
const gateway = usePaymentGateway(actor);

await gateway.isReady();

if (gateway.meta.value.isRenderless === false) {
  await gateway.render(containerElement);
}

gateway.input({ card_num: "4111111111111111" /* … */ });
await gateway.update();
```

See [Usage](./docs/usage.md) for the complete API reference.

## Features

| Feature | Status | Notes |
| --- | --- | --- |
| One lifecycle contract for every provider | ✅ | Load, draw (if needed), validate, submit — the same shape whatever the provider. |
| Eight named provider variants | ✅ | `braintree`, `card`, `dlocal`, `mercadoPago`, `nicky`, `openPay`, `razorpay`, `stripe` — each plugs its own load/render/validate/submit into the shared machine. |
| Pay context and Add context from one spawn | ✅ | The same lifecycle either charges an amount or stores a method with nothing owed, decided by how the gateway was spawned. |
| Currency-aware amount conversion | ✅ | Converts a display amount into a provider's minor-unit format, correctly for zero-decimal and unusually-scaled currencies alike. |
| Payer contact collection on demand | ✅ | Collects the payer's email/phone into the form only when the client has none on file, evaluated fresh on every load. |
| Off-site redirect resume | ✅ | The one provider variant whose confirmation step can leave the page registers a pending operation before it does, and resumes from it on return. |
| Nicky provider variant | ⏳ | Wired into the shared machine and unit-proven, but has never appeared unlocked on the currency/country pairs this brand's fixtures sweep — see gotchas. |

## Key Concepts

### The lifecycle every gateway honours

`loading → (rendering, only if the provider needs a form) → available (checking → valid | invalid | error) → processing → processed → complete`, with an `unavailable` arm reachable from a failed load or a failed draw. Every named provider variant reaches the same states; only what happens *inside* `load`, `render`, `validate`, `pay` and `add` differs per provider.

### Pay context vs Add context

A gateway spawned to **pay** an outstanding amount only wires its `PAY` submit event and produces a payment detail. A gateway spawned to **add** a payment method with nothing owed only wires `ADD` and produces a new stored-method id instead. The same machine and the same per-provider extension points serve both — only the active context differs.

### Provider families, not just providers

Providers group into a handful of shapes rather than eight unrelated ones: SDK-embedded card forms (Stripe, Braintree, MercadoPago, OpenPay), a raw server-side card form (`card`), and redirect/checkout providers that still collect a small form of their own (RazorPay, dLocal, Nicky). Knowing the family tells you what the captured-input shape and the completed-output shape look like — see [foundation.md](./docs/foundation.md) for the exact shapes.

### Actor Types

This module carries no actor split. It has no `.as('client')` / `.as('staff')` accessor and no scope matrix — whoever spawns a gateway (the capture module, always) decides which client and which order it acts against, as a plain argument on the spawn context.

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start |
| [Foundation](./docs/foundation.md) | Architects rebuilding on another stack | Portable capability + data-shape spec |
| [Usage](./docs/usage.md) | All devs (incl. external) | API reference, examples |
| [Architecture](./docs/architecture.md) | Internal / contributors | State machine, provider wiring, dependencies |
| [Gotchas](./docs/gotchas.md) | All | Edge cases, known issues, what's owed |
| [Changelog](./docs/changelog.md) | All | What changed, and why |
| [GATEWAYS.md](./GATEWAYS.md) | Internal | The full provider registry — every gateway code the platform knows about, by wire type |

## Playground

There is no standalone playground page for this module — a gateway only exists once something has spawned it, and today only the sibling capture module does that. The closest driveable proof is the capture module's own ADD-flow playground page (`playgrounds/labs/src/pages/paymentDetailAdd/`), which spawns a real gateway underneath it, and the e2e checkout suite under `tests/Playwright/e2e/e2e-tests/checkout/payment-gateways/`.

The module's own behaviour is proven by its co-located suite — 349 tests across `__tests__/`, at 86.2% statement and 89.8% function coverage, replaying fixtures recorded from real staging by `pnpm fixtures:generate payment-gateways`. One of the module's 39 documented scenarios is recorded as owed rather than proven — see [gotchas.md](./docs/gotchas.md) for what's blocked and why.

> **🔧 For Contributors:** adding a ninth provider means adding a ninth sub-folder with its own `types.ts` and whichever of `services.ts` / `actions.ts` / `schemas.ts` it needs to override — the shared machine and the default services already cover everything a provider doesn't customise.
