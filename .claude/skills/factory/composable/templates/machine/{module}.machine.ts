/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-xstate.md` (naming, required-state pattern, SET
 * handling, canonical state-read APIs — cite, never restate) +
 * `code-composables.companion.md` "Variance law" clause 4. A disagreement
 * between this skeleton, its worked example, and the doctrine is a surfaced
 * finding, never silently resolved toward either.
 */

import { createMachine, assign } from "xstate";
import schemas from "./module.schemas";
import services from "./module.services";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ModuleContext } from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.machine
 * @description Module machine. Reads ONLY its own context — the concrete
 * actor is seeded at construction by `useModule.ts`'s scope factory; this
 * file never imports `ScopeActorTypes.SELF` (clause 4).
 *
 * @doctrine `code-xstate.md` "Required State Pattern" (form/CRUD machines) +
 * "Form States MUST Handle SET Events".
 * @worked-example `account/account.machine.ts`.
 *
 * No `{module}.machine.{actor}.ts` worked example exists anywhere in this
 * codebase today — Part B's "same pattern for every layer" note is
 * theoretical for machines specifically. If a scope ever earns a divergent
 * machine, that is new ground; don't invent a shape here un-cited.
 */
export default createMachine(
  {
    id: "module",
    predictableActionArguments: true,
    initial: "available",
    context: {
      error: undefined,
      // The CONCRETE actor, seeded at construction by `useModule.ts`'s scope
      // factory. Never `ScopeActorTypes.SELF` — the scope builder resolves
      // SELF before the machine is ever created (clause 4).
      scopeActor: undefined
    } as ModuleContext,
    states: {
      // @doctrine `code-xstate.md` Required State Pattern — every form/CRUD
      // state exposes checking → valid/invalid, and the owning state handles
      // SET (see the rule's "MUST Handle SET Events" callout).
      available: {
        // Before `checking` invokes `parse` — that service and `validate` both
        // early-return on an unset `schema`, so a form with no assign here
        // validates clean however invalid it is.
        entry: ["setSchemas"],
        initial: "checking",
        states: {
          checking: {
            invoke: {
              src: "parse",
              onDone: { target: "valid", actions: ["setModel"] },
              onError: { target: "invalid", actions: ["setError"] }
            }
          },
          valid: {},
          invalid: {},

          // The settle target `useModule.actions.ts`'s `login` waits on. A
          // service rejection is a BACKEND failure, so it lands in the terminal
          // `error` state — `available.invalid` is for a form that failed to
          // parse, which is what `checking` above reports.
          loggingIn: {
            invoke: {
              src: "login",
              onDone: { target: "#complete", actions: ["setModel"] },
              onError: { target: "#error", actions: ["setError"] }
            }
          },

          // Invokes the services arm's `register` override — the settle target
          // `useModule.actions.{actor}.ts`'s own `register` waits on.
          registering: {
            invoke: {
              src: "register",
              onDone: { target: "#complete", actions: ["setModel"] },
              onError: { target: "#error", actions: ["setError"] }
            }
          },

          // ACTOR-SCOPE-GUARDED STATE worked example — reachable ONLY by the
          // actor whose guard admits it, and invokes the services arm's
          // `registerAsGuest`: the settle target
          // `useModule.actions.{actor}.ts`'s own `registerAsGuest` waits on.
          registeringAsGuest: {
            invoke: {
              src: "registerAsGuest",
              onDone: { target: "#complete" },
              onError: { target: "#error", actions: ["setError"] }
            }
          }
        },
        on: {
          SET: { target: ".checking", actions: ["setModel"] },
          LOGIN: { target: ".loggingIn", actions: ["setModel"] },
          REGISTER: { target: ".registering", actions: ["setModel"] },

          // ACTOR-SCOPE-GUARDED TRANSITION worked example — the same event is a
          // no-op for every other actor, because the guard fails and no other
          // target is offered. This is how a capability is gated by scope
          // WITHOUT the machine branching on actor inside an action.
          REGISTER_AS_GUEST: {
            target: ".registeringAsGuest",
            cond: "canRegisterAsGuest"
          }
        }
      },

      // A TERMINAL FAILURE STATE, separate from `available.invalid`: a service
      // rejected. Every `invoke`'s `onError` lands here.
      error: {
        id: "error"
      },

      // A TERMINAL FAILURE STATE, separate from `available.invalid`.
      complete: {
        id: "complete",
        type: "final"
      }
    }
  },
  {
    actions: {
      setModel: assign({
        model: (_context: ModuleContext, event: AnyEventObject) => event.data
      }),
      setError: assign({
        error: (_context: ModuleContext, event: AnyEventObject) => event.data
      }),
      // @worked-example `account/account.machine.ts:383-386`'s
      // `setRegisterSchemas`. The actor comes off the context the machine
      // already holds, so the parsers resolve per-actor without this file
      // knowing whether the layer is armed.
      setSchemas: assign({
        schema: (context: ModuleContext) =>
          schemas.useModuleSchemaParser(context),
        uischema: (context: ModuleContext) =>
          schemas.useModuleUischemaParser(context)
      })
    },
    // ACTOR-SCOPE GUARDS — named for the CAPABILITY they gate, bodied by the
    // concrete `scopeActor` already on context. @doctrine clause 4
    // (`code-composables.companion.md` "Variance law") — the machine receives
    // an already-resolved actor and never branches on `ScopeActorTypes.SELF`.
    // @worked-example `auth/auth.machine.ts:698`'s own one-line actor read.
    // The actor a guard admits must be the one whose arm supplies the service
    // the guarded state invokes — CLIENT here, because `registerAsGuest` lives
    // on `module.services.client.ts` (`auth/auth.services.client.ts:204-252`).
    // Naming any other actor admits a transition whose service resolves to
    // nothing. Ship ONLY the guards your transitions reference — an unused
    // guard is dead code in a real module.
    guards: {
      canRegisterAsGuest: ({ scopeActor }: ModuleContext) =>
        scopeActor === ScopeActorTypes.CLIENT
    },
    services
  }
);
