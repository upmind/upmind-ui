/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-services.md` (service-authoring, actor-split
 * decision) + `code-composables.companion.md` "Variance law" clauses 2/3. A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 */

import {
  useModelParser,
  useValidation,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { ScopeActorTypes } from "../scope";
// import { createClientModuleServices } from "./module.services.client";
import type {
  ModuleContext,
  ModuleModel,
  ModuleServices
} from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.services
 * @description Module machine services.
 *
 * @doctrine clause 2 (fresh modules start armless) — no
 * `module.services.{actor}.ts` file yet, so `scopedServices()` resolves to its
 * `default:` branch. The matrix itself is always here: the file's shape does not
 * change the day a scope earns an arm, only which branch answers. Earn the split
 * only when an actor's business logic actually diverges —
 * `code-services.md`'s actor-split decision (different endpoint / grant type /
 * response shape / business logic) — see clause 3.
 * @worked-example `auth/auth.services.ts:151-161`'s `scopedServices()` switch,
 * merging the shared functions below with a per-actor factory
 * (`createStaffAuthServices()` / `createClientAuthServices()` /
 * `createGuestAuthServices()`), never a `.base.ts` file.
 *
 * @merge-seam Arming is an addition, not a swap: uncomment the arm's import and
 * its `case` in `scopedServices()`. Attach a `@decision` block
 * (`what:`/`why:`/`rejected:`) adjacent to it (clause 5). Steps and the arm-file
 * worked example (`module.services.{actor}.ts`):
 * `.claude/skills/factory/composable/templates/ARMS.md`.
 */

async function parse(
  { model = {}, schema }: ModuleContext,
  _event: AnyEventObject
) {
  if (!schema) return model as ModuleModel;
  return useModelParser(schema, model as Record<string, unknown>);
}

async function validate(
  { schema, model }: ModuleContext,
  _event: AnyEventObject
) {
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          "Validation failed",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(model);
    }
  });
}

/**
 * Domain service worked example — invoked by the machine's `loggingIn` state,
 * which `use{Module}.actions.ts`'s `login` sends `LOGIN` to reach. Shared, not
 * arm-resolved: the arm's `login` override diverges in the ACTION's own
 * composition, not in the wire call (`useModule.actions.{actor}.ts`).
 */
async function login(
  { model }: ModuleContext,
  _event: AnyEventObject
): Promise<unknown> {
  // Replace with the request this module's parity table names.
  return Promise.resolve(model);
}

// -----------------------------------------------------------------------------
// Machine-Ready Services

/**
 * Service matrix: maps scopeActor types to their service implementations.
 * Actor-specific services are created via factories, shared services are
 * declared directly on `moduleServices` below. The shape is the same armed or
 * armless — an armless module has only the `default:` case, so nothing here or
 * downstream changes when an arm is earned.
 * @worked-example `auth/auth.services.ts:151-161`.
 */
function scopedServices(scopeActor: ScopeActorTypes): Partial<ModuleServices> {
  switch (scopeActor) {
    // case ScopeActorTypes.CLIENT:
    //   return createClientModuleServices();
    default:
      // Armless default. The machine's service dispatchers call
      // `scopedServices(actor).register!(…)` through `context.scopeActor`, so
      // every actor-scoped member must be PRESENT here even when unarmed — as a
      // Forbidden-rejecting stub, never absent (an absent member would crash the
      // dispatcher's `!` call at runtime). This is why the machine default is
      // NOT `{}` like the query variant's: query services are optional on the
      // contract and resolved by spread, never called through a machine
      // dispatcher — a deliberate, load-bearing machine↔query divergence. When
      // an actor earns an arm, add its `case` above; the arm overrides these.
      return {
        register: () =>
          Promise.reject(
            new DetailedError(
              "Cannot Register",
              responseCodes.Forbidden,
              ErrorOrigin.Headless,
              scopeActor
            )
          ),
        registerAsGuest: () =>
          Promise.reject(
            new DetailedError(
              "Cannot Register as guest",
              responseCodes.Forbidden,
              ErrorOrigin.Headless,
              scopeActor
            )
          )
      };
  }
}

/**
 * Services object ready for direct use in the XState machine. Each dispatcher
 * resolves the arm from `context.scopeActor` — the query variant resolves the
 * same value from an argument, having no machine context — and asserts with `!`
 * because the member is optional on the contract until an arm supplies it
 * (`auth/auth.services.ts:236`'s own `registerAsGuest!`).
 */
export const moduleServices = {
  login,
  parse,
  validate,

  /** Delegates to the resolved arm — `!` because no arm is earned yet. */
  register: (context: ModuleContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor as ScopeActorTypes).register!(
      context,
      event
    ),

  /** Actor-exclusive; optional on the contract, hence the assertion. */
  registerAsGuest: (context: ModuleContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor as ScopeActorTypes).registerAsGuest!(
      context,
      event
    )
};

export default moduleServices;
