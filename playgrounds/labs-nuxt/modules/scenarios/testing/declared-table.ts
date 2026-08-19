/**
 * @module scenarios/testing/declared-table
 * @description A table channel that DECLARES — the real `useTableChannel`'s own
 * `declared()` over a module's own `useQuerySchema()` and `useSortUischema()`,
 * reached across the package boundary through `internalKits`. A surface mounted
 * on it offers the ordering the MODULE declares, so what a spec measures is the
 * declaration → catalogue path rather than a list the spec supplied.
 *
 * `read` / `emit` stay the harness-shaped double the surface specs already use:
 * the live-model half of the channel is proven against the real cell in
 * `runtime/composables/__tests__/table-channel.int.spec.ts`, and restating its
 * pagination mapping here would be a second spelling of it.
 */

import { computed, ref } from "vue";
import { internalKits } from "@upmind-automation/headless/testing";
import { useTableChannel } from "../runtime/composables/useTableChannel";
import type { ModulePortCriteria } from "../runtime/composables/useModulePort.types";
import type {
  DeclaringTableChannel,
  TableChannelCell
} from "../runtime/composables/useTableChannel.types";
import type {
  ControlledTableChannel,
  TableModel
} from "@upmind-automation/scenario-harness";

/** The modules whose `@internal` schema family this playground drives. */
export type DeclaringModule = "client-email" | "client-email-history";

export type DeclaredTableOptions = {
  emit?: ControlledTableChannel["emit"];
  sort?: TableModel["sort"];
  total?: number;
  perPage?: number;
};

/**
 * A module's `@internal` declaration trio. `InternalKit`'s index signature types
 * anything past the query pair as `unknown`, so the one cast lives here rather
 * than in each spec that needs the sort uischema.
 */
export const declaringSchemas = async (module: DeclaringModule) => {
  const kit = await internalKits[module]();
  return {
    schema: kit.useQuerySchema(),
    uischema: kit.useQueryUischema(),
    sortUischema: (kit.useSortUischema as () => unknown)()
  };
};

export async function declaringChannel(
  module: DeclaringModule,
  options: DeclaredTableOptions = {}
): Promise<DeclaringTableChannel> {
  const { schema, sortUischema } = await declaringSchemas(module);
  const sort = options.sort ?? [];
  const perPage = options.perPage ?? 10;
  const total = options.total ?? 0;

  const cell: TableChannelCell = {
    useContext: () => ({
      query: { value: { sort } },
      schemas: { query: { schema, sortUischema } },
      pagination: { value: { page: 1, limit: perPage, count: total } }
    }),
    useActions: () => ({
      filterBy: () => undefined,
      sortBy: () => undefined,
      nextPage: () => undefined,
      prevPage: () => undefined
    })
  };

  return {
    read: () => ({ filter: {}, sort, pagination: { page: 1, perPage, total } }),
    emit: options.emit ?? (() => undefined),
    declared: useTableChannel(cell).declared
  };
}

/** The module's own criteria pair — what makes a surface draw its controls. */
export async function declaringCriteria(
  module: DeclaringModule
): Promise<ModulePortCriteria> {
  const { schema, uischema } = await declaringSchemas(module);
  const model = ref<Record<string, unknown>>({});

  return {
    schema,
    uischema,
    model: computed(() => model.value),
    set: next => {
      model.value = { ...model.value, ...next };
    }
  };
}
