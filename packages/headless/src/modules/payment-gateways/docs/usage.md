# payment-gateways Usage & API

## Composable Structure

There is exactly one composable, and it is a **lens onto an already-spawned actor** — it never spawns one itself:

```ts
import type { ComputedRef } from "vue";
import type { ActorRef } from "xstate";
import type { UseActor, UsePaymentGateway } from "@upmind-automation/headless";

declare function usePaymentGateway(
  service: ActorRef<any, any> | ComputedRef<UseActor | undefined>
): UsePaymentGateway;
```

`service` is the gateway actor the capture module spawned (a raw `ActorRef`) or a `ComputedRef` that resolves to one — the composable accepts either so a caller can pass a reactive "whichever gateway is currently selected" reference. There is no scoped-composable split (`.as('client')` / `.as('staff')`) and no `useMeta()`/`useContext()`/`useActions()` layering — every member sits flat on the one return object.

```ts
import { inject } from "vue";
import { usePaymentGateway } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { UseActor } from "@upmind-automation/headless";

// `actor` is a gateway spawned elsewhere and handed down — never spawned here.
const actor = inject<ComputedRef<UseActor | undefined>>("gatewayActor");
const gateway = usePaymentGateway(actor!);
```

## State

```ts
import { usePaymentGateway } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { UseActor } from "@upmind-automation/headless";

// The gateway actor the capture module spawned and handed down.
declare const actor: ComputedRef<UseActor | undefined>;

const {
  state, // computed(() => actor.value?.state.value.toStrings())
  isReady // () => Promise<boolean>
} = usePaymentGateway(actor);
```

`isReady()` polls until the actor itself exists (useful when `actor` is a `ComputedRef` that starts out `undefined`), then waits for it to leave its `loading` phase — resolving `true` once it settles anywhere else, `false` if it settles as `unavailable` or `complete`. Its wait has **no timeout** — a gateway stuck mid-transition hangs the promise forever rather than rejecting.

## Meta (State Flags)

`meta` is one `computed`, so read through `.value`.

| Flag              | True when                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `needsPayment`    | An actor exists, the amount is non-negative, the gateway isn't `OFFLINE`, and the gateway is supported. |
| `isNotSupported`  | No actor exists, or `supported` isn't `true`.                                                           |
| `isLoading`       | The actor is in its `loading` phase.                                                                    |
| `isRendering`     | No actor exists, or it is in its `rendering` phase.                                                     |
| `isAvailable`     | The actor is `available` or `processing`.                                                               |
| `isUnavailable`   | The actor is `unavailable`.                                                                             |
| `hasErrors`       | The actor is in `available.error`.                                                                      |
| `isProcessing`    | The actor is `processing`.                                                                              |
| `isValid`         | The actor is in `available.valid`.                                                                      |
| `isDirty`         | The captured model is non-empty.                                                                        |
| `isComplete`      | The actor is done, `processed`, or `complete`.                                                          |
| `isRenderless`    | The context is flagged renderless, or every property on the current schema is read-only.                |
| `hasRenderer`     | The context carries a renderer function.                                                                |
| `hasInstructions` | The gateway carries `payment_instructions`.                                                             |

## Context (Computed Values)

```ts
import { usePaymentGateway } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { UseActor } from "@upmind-automation/headless";

// The gateway actor the capture module spawned and handed down.
declare const actor: ComputedRef<UseActor | undefined>;

const {
  context, // the full gateway context
  errors, // the machine's error message, if any
  validationErrors, // field-level validation detail (ajv-shaped)
  instructions, // the gateway's own payment instructions
  model, // the currently captured form value
  gateway, // the gateway record this actor was spawned with
  clickwrap, // the brand's consent disclaimer, from config — not part of the model
  schema, // JsonSchema — the form definition for the active context
  uischema // its layout
} = usePaymentGateway(actor);
```

`clickwrap` is read from brand configuration directly by this composable — it is not something the spawning capture module has to pass down.

## Actions

```ts
import { usePaymentGateway } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { UseActor } from "@upmind-automation/headless";

// The gateway actor the capture module spawned and handed down.
declare const actor: ComputedRef<UseActor | undefined>;

const {
  clear, // () => void — resets captured input and any error
  input, // (value) => void — records a value without asking the gateway to proceed
  update, // (value?) => Promise<void> — submits the gateway
  render // (container: HTMLElement | null) => Promise<void> — draws the gateway's hosted form
} = usePaymentGateway(actor);
```

- **`clear()`** sends a plain reset. It does not touch the driveable state itself — a cleared gateway is still available, just holding no input.
- **`input(value)`** records a value without triggering a re-check against the provider — use it while the client is still typing.
- **`update(value?)`** is the submit call for both PAY and ADD context (the machine only wires the event that matches the context it was spawned with — calling it in the wrong context is a no-op, not an error). If the value passed differs from what is already captured, it captures the new value first and lets the gateway re-check itself before proceeding; if it is unchanged, it asks the gateway to proceed directly rather than re-capturing. Calling it with no argument (or a falsy one) is a no-op. It waits up to 60 seconds for the gateway to settle and rejects with a translated error if the provider refuses.
- **`render(container)`** offers the gateway a page element to draw its hosted form into. Passing `null` logs the fault and resolves without doing anything — it never fails the wider payment. A gateway that needs no form (renderless, or carrying no provider SDK at all) is never asked to draw, silently.

> **⚠️ The returned promise is not the draw's own completion signal.** `render()`'s promise settles once the gateway is confirmed ready to accept a draw request — not once the draw itself has actually finished. A caller that needs to know the form has actually mounted has to read the gateway's own state afterwards rather than trust the promise. See [gotchas.md](./gotchas.md) for the concrete effect.

## Lifecycle

`usePaymentGateway` never spawns or stops the actor it is given — spawning, and stopping, belong entirely to whoever calls `spawn()`. The one caller that does this today spawns a gateway as a child of its own capture flow and stops it when that flow itself resets or completes.

The gateway must be spawned **as a child of some parent**. Reaching its driveable-and-valid state always notifies a parent — a gateway interpreted standalone with no parent reaches that internal state but the notification has nowhere to land, and the gateway appears to stall there from the caller's side.

## Vue Component Integration

The real consumer (`packages/client-vue/src/modules/payment/components/PaymentGateways.vue`) receives the spawned actor from its parent — typically via `inject`, the same pattern the sibling capture module's own components use — rather than spawning anything itself:

```vue
<script setup lang="ts">
import { inject } from "vue";
import type { ComputedRef } from "vue";
import { usePaymentGateway } from "@upmind-automation/headless";
import type { UseActor } from "@upmind-automation/headless";

const actor = inject<ComputedRef<UseActor | undefined>>("gatewayActor");
const gateway = usePaymentGateway(actor!);

const { meta, schema, uischema, model, errors } = gateway;
</script>

<template>
  <div v-if="meta.isRenderless === false" ref="container" />
  <!-- for renderless gateways, drive `schema`/`uischema` through a JSONForms
       renderer bound to `model` instead -->
  <p v-if="meta.hasInstructions">{{ gateway.instructions }}</p>
  <p v-if="meta.hasErrors">{{ errors }}</p>
</template>
```

## Schema-Driven Form Integration

`schema`/`uischema` are JSONForms definitions (`@jsonforms/core`) for whichever provider variant the actor was spawned with, and every uischema control carries an `i18n` key rather than hardcoded copy. A gateway that needs no form at all (see `meta.isRenderless`) still returns a valid, empty schema — a form renderer bound to it simply renders nothing, rather than needing special-case handling for "no form".
