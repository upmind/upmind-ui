// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioWorld
 * @description The IN-PAGE `World` — the BDD execution seam driven against the
 * live composables the playground already renders, so one `.feature` runs here
 * and through the Playwright bridge without a second implementation of the
 * scenario.
 *
 * Registry-generic: it holds no module knowledge at all. `boot` looks the key
 * up in the scenario contract (`registry.ts`) and everything else reads the
 * seam port, exactly as `NodeWorld` does over its fixture modules.
 */

import {
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "@upmind-automation/headless";
import { registry } from "../registry";
import { useModulePort } from "./useModulePort";
import { useScenarioStage } from "./useScenarioStage";
import {
  get,
  isEmpty,
  isEqual,
  isFunction,
  isMatch,
  isString,
  keys,
  omit,
  pick
} from "lodash-es";
import type { ScenarioBinding, ScenarioKey } from "../scenario.types";
import type { ModulePort } from "./useModulePort.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** Every failure here is a harness-authoring mistake, surfaced as the module error shape. */
/** Long enough for a hand to see the editor arrive, and its fields fill. */
const STEP_BEAT_MS = 700;

/** How long a press is given to open an editor before it plainly did not. */
const EDITOR_WAIT_MS = 400;

/** A pause the user can actually watch a step happen in. */
function beat(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, STEP_BEAT_MS));
}

function fail(message: string): never {
  throw new DetailedError(
    `scenario world: ${message}`,
    responseCodes.Bad_Request,
    ErrorOrigin.Headless
  );
}

/**
 * Builds the in-page world over the scenario contract.
 *
 * @param bindings The scenario contract, defaulted to this playground's own
 * registry and overridable so a spec can drive a narrowed set.
 */
export function useScenarioWorld(
  bindings: Record<ScenarioKey, ScenarioBinding> = registry
): World<ScenarioKey> {
  let port: ModulePort | undefined;
  let booted: { key: ScenarioKey; scope: WorldScope } | undefined;

  function requirePort(): ModulePort {
    if (!port) fail("boot() has not been called yet");
    return port;
  }

  function dispose(): void {
    const destroy = get(port?.actions ?? {}, "destroy");
    if (isFunction(destroy)) destroy();
    port = undefined;
    booted = undefined;
  }

  return {
    async boot(key, scope: WorldScope) {
      // The scope registry caches by scope key, so `port` IS the cell the page
      // renders: re-booting the scope already on screen ADOPTS it, because
      // disposing would `destroy()` the rendered surface mid-track. A different
      // key or scope addresses a different cell and disposes exactly as before.
      if (booted?.key === key && isEqual(booted.scope, scope)) return;

      dispose();

      const entry = get(bindings, key);
      if (!entry) fail(`unknown scenario key "${key}"`);

      // The harness's `ScopeActor` is a documented mirror of `ScopeActorTypes`
      // over the vue-free source enum (`world/scope-actor.ts`), sharing its
      // wire values — so a feature may name the actor and it lands as the
      // enum the scope builder takes. `WorldScope.context` is already the
      // complete `{ type, id }` pair a scope is only ever expressed as.
      port = useModulePort((entry.useList ?? entry.useMutate)!, {
        actor: scope.actor as ScopeActorTypes,
        context: scope.context
      });
      booted = { key, scope };
    },

    async fire(actionId, input) {
      // The screen first, always. A step is a PRESS: it runs the control's own
      // closure, so the spinner turns, the toast lands, and a handoff opens its
      // editor over the list — the whole point of watching a replay.
      const stage = useScenarioStage();
      const rowId = isString(input)
        ? input
        : (get(input, "id") as string | undefined);

      if (stage.offers(actionId, rowId)) {
        await stage.press(actionId, rowId);

        // A control that opens a form has not finished until the form is
        // submitted — that IS the rest of the press, as a hand would make it.
        const editor = await stage
          .whenEditor(EDITOR_WAIT_MS)
          .catch(() => undefined);
        if (editor) {
          // Held, deliberately. All of it in one tick puts the editor on screen
          // for less than a frame, which reads as the invisible replay this
          // seam exists to replace.
          await beat();

          const fields = omit((input ?? {}) as Record<string, unknown>, "id");
          if (!isEmpty(fields)) {
            editor.fill(fields);
            await beat();
          }

          await editor.submit();
        }

        return;
      }

      // No screen at all — the Node runner, and the playability probe that boots
      // a track without mounting it. Nothing else may take this branch.
      const action = get(requirePort().actions, actionId);
      if (!isFunction(action)) fail(`unknown action "${actionId}"`);

      await action(input);
    },

    async expectMeta(expected) {
      const live = requirePort().getMeta();
      if (!isMatch(live, expected))
        fail(
          `meta mismatch — expected ${JSON.stringify(expected)}, got ${JSON.stringify(pick(live, keys(expected)))}`
        );
    },

    async expectContext(expected) {
      const live = requirePort().snapshot().context;
      if (!isMatch(live, expected))
        fail(
          `context mismatch — expected ${JSON.stringify(expected)}, got ${JSON.stringify(pick(live, keys(expected)))}`
        );
    },

    async dispose() {
      dispose();
    }
  };
}
