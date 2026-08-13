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

import { shallowRef } from "vue";
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
//     most one editor over that. Shared across every instance by design.
const collection = shallowRef<StageCollection | undefined>();

const editor = shallowRef<StageEditor | undefined>();

function fail(message: string): never {
  throw new Error(`scenario stage: ${message}`);
}

// -----------------------------------------------------------------------------

export function useScenarioStage(): ScenarioStage {
  function registerCollection(value: StageCollection): void {
    collection.value = value;
  }

  function registerEditor(value: StageEditor): void {
    editor.value = value;
  }

  async function whenEditor(
    timeout: number = EDITOR_TIMEOUT_MS
  ): Promise<StageEditor> {
    const deadline = performance.now() + timeout;
    while (!editor.value) {
      if (performance.now() > deadline)
        fail(
          "no editor opened — the press that should have opened one did not"
        );
      await new Promise(resolve => setTimeout(resolve, EDITOR_POLL_MS));
    }

    return editor.value;
  }

  return {
    registerCollection,
    registerEditor,
    whenEditor,
    isStaged: () => !!collection.value,
    press: (actionName, rowId) =>
      collection.value
        ? collection.value.press(actionName, rowId)
        : fail(`nothing is on stage to press "${actionName}" on`),
    offers: (actionName, rowId) =>
      collection.value?.offers(actionName, rowId) ?? false,
    fill: input =>
      editor.value
        ? editor.value.fill(input)
        : fail("no editor is open to fill"),
    submit: () =>
      editor.value ? editor.value.submit() : fail("no editor is open to submit")
  };
}

/**
 * Clear the stage. The surfaces do this on unmount; a world disposing between
 * tracks does it too, so a stale collection can never be pressed by the next.
 */
export function clearScenarioStage(role?: "collection" | "editor"): void {
  if (role !== "editor") collection.value = undefined;
  if (role !== "collection") editor.value = undefined;
}
