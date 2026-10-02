// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useRecordSources
 * @description Boots each record section's declared `source` — a second
 * composable read for the record on screen — through the one port a list page
 * boots with, `.for(context.type, id)` at the declared actor. A new record id
 * destroys the old cell and boots a fresh one; unmount destroys them all.
 */

import { toDataPath } from "@jsonforms/core";
import { computed, onUnmounted, shallowReactive, unref, watch } from "vue";
import { resolveScope } from "../scenario.utils";
import { useModulePort } from "./useModulePort";
import { filter, forEach, get, isFunction, isNil, set } from "lodash-es";
import type { ModulePort } from "./useModulePort.types";
import type { RecordSources } from "./useRecordSources.types";
import type {
  RecordCollectionSection,
  RecordSectionDeclaration
} from "../scenario.types";

// -----------------------------------------------------------------------------

type Booted = { id: string; port: ModulePort };

function destroy(booted?: Booted): void {
  const destroyCell = get(booted?.port.actions, "destroy");
  if (isFunction(destroyCell)) destroyCell();
}

/**
 * @param sections The record's declared sections; those with a `source` boot.
 * @param model The record model each source's id is read off.
 */
export function useRecordSources(
  sections: () => RecordSectionDeclaration[],
  model: () => Record<string, unknown>
): RecordSources {
  const booted = shallowReactive(new Map<string, Booted>());
  const declared = computed(() => sourced());

  function sourced(): RecordCollectionSection[] {
    return filter(
      sections(),
      section => section.kind === "collection" && !!section.source
    ) as RecordCollectionSection[];
  }

  function idOf(section: RecordCollectionSection): string | undefined {
    const id = unref(resolveScope(model(), section.source!.context.idScope));
    return isNil(id) || id === "" ? undefined : String(id);
  }

  const ids = computed(() => {
    const next: Record<string, string | undefined> = {};
    forEach(declared.value, section => {
      next[section.key] = idOf(section);
    });
    return next;
  });

  const ports = computed(() => {
    const live: Record<string, ModulePort> = {};
    forEach(declared.value, section => {
      const entry = booted.get(section.key);
      if (entry && entry.id === ids.value[section.key])
        live[section.key] = entry.port;
    });
    return live;
  });

  function sync(next: Record<string, string | undefined>): void {
    forEach(declared.value, section => {
      const id = next[section.key];
      const entry = booted.get(section.key);
      if (entry?.id === id) return;
      destroy(entry);
      booted.delete(section.key);
      if (!id) return;
      const source = section.source!;
      const port = useModulePort(source.use, {
        actor: source.actor,
        context: { type: source.context.type, id },
        offeredActors: [source.actor]
      });
      booted.set(section.key, { id, port });
      const isReady = get(port.actions, "isReady");
      if (isFunction(isReady)) void isReady();
    });
  }

  watch(ids, sync, { immediate: true, flush: "sync" });

  const values = computed(() => {
    const patch: Record<string, unknown> = {};
    forEach(declared.value, section => {
      const port = ports.value[section.key];
      if (!port) return;
      const context = port.snapshot().context as Record<string, unknown>;
      set(
        patch,
        toDataPath(section.scope),
        unref(get(context, section.source!.rows ?? "data")) ?? []
      );
    });
    return patch;
  });

  function isLoading(key: string): boolean {
    const port = ports.value[key];
    return !!port && !!port.getMeta().isLoading;
  }

  onUnmounted(() => {
    booted.forEach(entry => destroy(entry));
    booted.clear();
  });

  return { values, isLoading };
}
