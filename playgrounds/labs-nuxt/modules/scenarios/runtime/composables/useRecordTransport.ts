// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useRecordTransport
 * @description The route-param transport for a page addressed by ONE record
 * (`/useContractProduct/:id`). The page boots the declaration's manager
 * `.withId(id)` for the url's record, and every manager step a track plays boots
 * the record its own recording addressed: that record wins while the track is
 * armed, and Live hands the page back to the url's.
 *
 * Every cell the page opens is held once, keyed by its record, so each is
 * destroyed exactly once — on a track change (all but the url's) and on unmount
 * (all of them).
 */

import { computed, onUnmounted, ref, watch } from "vue";
import { bindings as allBindings } from "../registry";
import { useModulePort } from "./useModulePort";
import { useScenarioWorld } from "./useScenarioWorld";
import { get, isFunction } from "lodash-es";
import type { ModulePort } from "./useModulePort.types";
import type {
  RecordTransport,
  RecordTransportSource
} from "./useRecordTransport.types";
import type { UseScenarioPlayer } from "./useScenarioPlayer.types";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const NO_META = {};

/**
 * Builds the record page's transport.
 *
 * @param source The key, the manager, the url's record and the actor it boots at.
 */
export function useRecordTransport(
  source: RecordTransportSource
): RecordTransport {
  const replayId = ref<string>();

  // An id-less record names no instance: its subject is the page's own key, so
  // the surface draws as soon as the cell boots, and the cell is booted at the
  // actor alone — the key is a handle for the map, never a `.withId`.
  const home = source.idless ? source.key : source.id;

  const subjectId = computed(() => replayId.value ?? home);

  const cells = new Map<string, ModulePort>();

  function cellFor(id: string): ModulePort {
    const cell =
      cells.get(id) ??
      useModulePort(source.composable, {
        actor: source.actor,
        id: source.idless ? undefined : id,
        offeredActors: source.offeredActors
      });
    cells.set(id, cell);
    return cell;
  }

  function release(keep?: string): void {
    for (const [id, cell] of cells) {
      if (id === keep) continue;
      const destroy = get(cell.actions, "destroy");
      if (isFunction(destroy)) destroy();
      cells.delete(id);
    }
  }

  if (home) cellFor(home);

  const current = computed(() =>
    subjectId.value ? cellFor(subjectId.value) : undefined
  );

  const port: ModulePort = {
    get actions() {
      return current.value?.actions ?? {};
    },
    getMeta: () => current.value?.getMeta() ?? NO_META,
    rawMeta: () => current.value?.rawMeta?.() ?? NO_META,
    scopeMatrix: source.composable.scopeMatrix,
    snapshot: () =>
      current.value?.snapshot() ?? { actions: [], context: {}, meta: NO_META },
    useContext: () => current.value?.useContext?.() ?? {}
  };

  const hostWorld = useScenarioWorld(allBindings, {
    key: source.key,
    id: source.idless ? undefined : source.id
  });

  const world: World = {
    ...hostWorld,
    async boot(key, scope) {
      await hostWorld.boot(key, scope);
      if (key === source.key && scope.id && !source.idless)
        replayId.value = scope.id;
    }
  };

  function follow(player: UseScenarioPlayer): void {
    watch(
      () => player.track.value,
      () => {
        replayId.value = undefined;
        void world.dispose();
        release(home);
      },
      { flush: "sync" }
    );
  }

  onUnmounted(() => {
    void world.dispose();
    release();
  });

  return { subjectId, port, world, follow };
}
