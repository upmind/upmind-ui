<template>
  <ModuleStateNotice
    v-if="state !== ModuleState.READY"
    :state="state"
    :detail="detail"
  />
  <div v-else :class="styles.detailSurface.root">
    <!-- The scenario's declared fields, drawn read-only through the same cell
         renderers the table uses (`R6-36`). The record is the row: a
         declaration draws it here exactly as it draws it in a column. -->
    <template v-if="elements.length">
      <div
        v-for="element in elements"
        :key="element.scope"
        :class="styles.detailSurface.field"
      >
        <span :class="styles.detailSurface.label">{{
          i18n.translate(element.i18n, element.i18n)
        }}</span>
        <CellDispatcher
          v-if="isPopulated(element)"
          :element="element"
          :row="model"
        />
        <!-- A read view answers for every field it declares: a value the record
             does not carry reads as absent rather than as a label with nothing
             under it, which is indistinguishable from a broken binding. -->
        <span v-else :class="styles.detailSurface.empty">&mdash;</span>
      </div>
    </template>
    <ContextPanel v-else :context="model" />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/DetailSurface
 * @description The Detail archetype surface — ONE record rendered read-only,
 * agnostic of where it came from: the single-read composable's own
 * `context.model` on an archetype page, or the record the read overlay hands it
 * from either feed. A scenario that declares `presentation.detail` draws its
 * fields through the same declared-cell renderers the table uses; one that does
 * not falls back to `ContextPanel`'s raw dump. Editing a record is the Form-Flow
 * archetype's job, full stop — this surface offers no write control of any kind.
 */

import { computed } from "vue";
import { useFormI18n } from "@upmind-automation/client-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { resolveScope } from "../../scenario.utils";
import { CellDispatcher } from "../cells";
import ContextPanel from "../ContextPanel.vue";
import { resolveModuleDetail, resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import config from "./DetailSurface.styles";
import { isNil, isPlainObject, some, values } from "lodash-es";
import type { DetailSurfaceProps } from "./DetailSurface.types";
import type { TableCell } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<DetailSurfaceProps>();

const i18n = useFormI18n();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => resolveModuleDetail(props.snapshot.context));
const model = computed(
  () =>
    (props.snapshot.context.model as Record<string, unknown> | undefined) ?? {}
);

const elements = computed<TableCell[]>(
  () => props.presentation?.elements ?? []
);

/**
 * Whether the record carries anything to draw for this field. A cell renders
 * only what it is given — a flags cell draws the TRUTHY flags, a date cell the
 * descriptor's own `relative` — so a record with none of them draws nothing,
 * and the surface owes the reader that answer explicitly.
 */
function isPopulated(element: TableCell): boolean {
  const value = resolveScope(model.value, element.scope);

  if (isNil(value) || value === "") return false;
  // A flags object is populated by any flag that is actually set; a `useDate`
  // descriptor by a date being there at all.
  if (isPlainObject(value)) return some(values(value), part => !!part);

  return true;
}

const meta = computed(() => ({ state: state.value }));
const styles = useStyles(["detailSurface"], meta, config);
</script>
