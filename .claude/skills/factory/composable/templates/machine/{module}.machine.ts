/** @internal */
// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { createMachine, assign } from "xstate";
import { ScopeActorTypes } from "../scope/scope.types";
import schemas from "./module.schemas";
import services from "./module.services";
import type { ModuleContext } from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.machine
 * @description Module machine.
 */

export default createMachine(
  {
    id: "module",
    predictableActionArguments: true,
    initial: "available",
    context: {
      error: undefined,
      scopeActor: undefined
    } as ModuleContext,
    states: {
      available: {
        // Schemas are set before `checking`: parse and validate pass an unset
        // schema, so a form without one validates clean.
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
          loggingIn: {
            invoke: {
              src: "login",
              onDone: { target: "#complete", actions: ["setModel"] },
              onError: { target: "#error", actions: ["setError"] }
            }
          },
          registering: {
            invoke: {
              src: "register",
              onDone: { target: "#complete", actions: ["setModel"] },
              onError: { target: "#error", actions: ["setError"] }
            }
          },
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
          REGISTER_AS_GUEST: {
            target: ".registeringAsGuest",
            cond: "canRegisterAsGuest"
          }
        }
      },
      error: {
        id: "error"
      },
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
      setSchemas: assign({
        schema: (context: ModuleContext) =>
          schemas.useModuleSchemaParser(context),
        uischema: (context: ModuleContext) =>
          schemas.useModuleUischemaParser(context)
      })
    },
    guards: {
      canRegisterAsGuest: ({ scopeActor }: ModuleContext) =>
        scopeActor === ScopeActorTypes.CLIENT
    },
    services
  }
);
