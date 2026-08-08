// -----------------------------------------------------------------------------
/**
 * @module factory/useScenarioWorld
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
import { registry } from "./registry";
import { useModulePort } from "./useModulePort";
import { get, isFunction, isMatch, keys, pick } from "lodash-es";
import type { ScenarioBinding } from "./registry.types";
import type { ModulePort } from "./useModulePort.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** Every failure here is a harness-authoring mistake, surfaced as the module error shape. */
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

  function requirePort(): ModulePort {
    if (!port) fail("boot() has not been called yet");
    return port;
  }

  function dispose(): void {
    const destroy = get(port?.actions ?? {}, "destroy");
    if (isFunction(destroy)) destroy();
    port = undefined;
  }

  return {
    async boot(key, scope: WorldScope) {
      dispose();

      const entry = get(bindings, key);
      if (!entry) fail(`unknown scenario key "${key}"`);

      // The harness's `ScopeActor` is a documented mirror of `ScopeActorTypes`
      // over the vue-free source enum (`world/scope-actor.ts`), sharing its
      // wire values — so a feature may name the actor and it lands as the
      // enum the scope builder takes.
      port = useModulePort(entry, {
        actor: scope.actor as ScopeActorTypes,
        contextId: get(scope, ["context", "id"])
      });
    },

    async fire(actionId, input) {
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
