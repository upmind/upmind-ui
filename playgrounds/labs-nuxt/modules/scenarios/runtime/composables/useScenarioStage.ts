// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioStage
 * @description THE stage a scenario acts on — the surfaces that are actually
 * mounted, offering the very controls a hand would press.
 *
 * A step used to reach PAST the screen: the world held a `ModulePort` and called
 * the composable's action directly, so the data moved and nothing else did. The
 * editor never opened, no field was filled, no control showed it was working.
 * A replay nobody can watch proves nothing about the product, which is the whole
 * of what the playground exists to show.
 *
 * So the surfaces publish what they draw, on the lifetime they draw it for — the
 * registry pattern `usePlaygroundSheet` already uses for its panes — and a step
 * presses that. `press("delete", id)` runs the SAME closure the row's own menu
 * item runs, feedback wrapper and all: the control spins, the toast lands, a
 * handoff opens its editor over the list. There is no second path for scenarios
 * to take, which is the point — a channel only a scenario uses would re-tell the
 * lie in a new place.
 *
 * The port stays the FALLBACK, for the worlds with no screen at all (the Node
 * runner, and the playability probe that boots a track without mounting it).
 * Nothing else may use it, or the lie comes straight back.
 */

import { getCurrentInstance, inject, shallowReactive } from "vue";
import { PLAYGROUND_URL_NAMESPACE } from "../../../../app/composables/usePlaygroundUrlState.types";
import type {
  ScenarioStage,
  StageCollection,
  StageEditor
} from "./useScenarioStage.types";

// -----------------------------------------------------------------------------

/** Long enough for an editor to mount and boot its own cell over the list. */
const EDITOR_TIMEOUT_MS = 5000;

/** The beat between polls while waiting for the editor to arrive. */
const EDITOR_POLL_MS = 50;

// --- Global, because the stage IS the screen: one collection is on it, and at
//     most one editor over that. Shared across every instance by design — and
//     held once PER PANEL on an area's page, where several collections are on
//     the screen at once and a press must reach the panel its step booted.
const DEFAULT_NAMESPACE = "";

const collections = shallowReactive(new Map<string, StageCollection>());

const editors = shallowReactive(new Map<string, StageEditor>());

function fail(message: string): never {
  throw new Error(`scenario stage: ${message}`);
}

// -----------------------------------------------------------------------------

export function useScenarioStage(): ScenarioStage {
  // Read once, here: a world presses from async callbacks long after setup,
  // when there is no instance left to inject from.
  const namespace =
    (getCurrentInstance()
      ? inject(PLAYGROUND_URL_NAMESPACE, undefined)
      : undefined) ?? DEFAULT_NAMESPACE;

  function registerCollection(value: StageCollection): void {
    collections.set(namespace, value);
  }

  function registerEditor(value: StageEditor): void {
    editors.set(namespace, value);
  }

  function clear(role?: "collection" | "editor"): void {
    clearScenarioStage(role, namespace);
  }

  /**
   * Resolves once a collection surface has registered itself on the stage.
   *
   * A handoff id (`manage`, `editRow`, `add`, `edit`) can only ever be pressed
   * on a mounted surface, and a deep link (`?track=…&scene=1`) arms and fires a
   * track while that surface is still mounting — so `offers()` was answering
   * false for a control that was merely late, not absent, and the world fell
   * through to the port and reported `unknown action`. Waiting turns that race
   * into a bounded wait; a control that genuinely never arrives still fails.
   */
  async function whenStaged(
    timeout: number = EDITOR_TIMEOUT_MS
  ): Promise<boolean> {
    const deadline = performance.now() + timeout;
    while (!collections.has(namespace)) {
      if (performance.now() > deadline) return false;
      await new Promise(resolve => setTimeout(resolve, EDITOR_POLL_MS));
    }

    return true;
  }

  async function whenEditor(
    timeout: number = EDITOR_TIMEOUT_MS
  ): Promise<StageEditor> {
    const deadline = performance.now() + timeout;
    while (!editors.has(namespace)) {
      if (performance.now() > deadline)
        fail(
          "no editor opened — the press that should have opened one did not"
        );
      await new Promise(resolve => setTimeout(resolve, EDITOR_POLL_MS));
    }

    return editors.get(namespace)!;
  }

  return {
    registerCollection,
    registerEditor,
    clear,
    whenEditor,
    whenStaged,
    isStaged: () => collections.has(namespace),
    press: (actionName, rowId) =>
      collections.has(namespace)
        ? collections.get(namespace)!.press(actionName, rowId)
        : fail(`nothing is on stage to press "${actionName}" on`),
    offers: (actionName, rowId) =>
      collections.get(namespace)?.offers(actionName, rowId) ?? false,
    fill: input =>
      editors.has(namespace)
        ? editors.get(namespace)!.fill(input)
        : fail("no editor is open to fill"),
    submit: () =>
      editors.has(namespace)
        ? editors.get(namespace)!.submit()
        : fail("no editor is open to submit")
  };
}

/**
 * Clear the stage. The surfaces do this on unmount; a world disposing between
 * tracks does it too, so a stale collection can never be pressed by the next.
 */
export function clearScenarioStage(
  role?: "collection" | "editor",
  namespace: string = DEFAULT_NAMESPACE
): void {
  if (role !== "editor") collections.delete(namespace);
  if (role !== "collection") editors.delete(namespace);
}
