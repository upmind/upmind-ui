<template>
  <component
    :is="host"
    :open="true"
    :title="t('labs.detail_title')"
    :direction="direction"
    :side="side"
    :size="size"
    :class="hostClass"
    :class-header="hostClassHeader"
    :class-content="hostClassContent"
    :class-footer="hostClassFooter"
    @update:open="onOpen"
  >
    <DetailSurface
      :snapshot="snapshot"
      :actions="surfaceActions"
      :presentation="presentation"
    />

    <!-- An explicit way back to the list, beside whatever dismiss the host's
         own chrome offers: the reader closes the pane rather than hunting for
         its edge. -->
    <!-- The way back to the list rides in the SAME group as the record's own
         actions: the host's `#close` slot wraps whatever it is given in its own
         close Button, so a control passed there draws inside a second one. -->
    <template #footer>
      <ActionSlots :actions="footerActions" :locked="locked" stretch />
    </template>
  </component>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DetailDialog
 * @description The read-only detail overlay — the READ twin of `ManageDialog`.
 * A surface shell (a side Sheet by default, a bottom Drawer or a modal when the
 * scenario says so) over
 * `DetailSurface`, fed ONE record from either feed: the clicked row's own data,
 * or — where the scenario declares `useDetail` — the full record that read
 * fetches, booted through the same write-agnostic `useModulePort` the editor
 * uses and marked with the row's own id. There is no write path of any kind:
 * editing a record is a handoff to the existing editor, carried by the row's
 * own actions.
 *
 * It holds the read instance for exactly as long as it is open, destroying it
 * on unmount for the same reason `ManageDialog` does: the scope registry caches
 * by key, so an instance left behind would be handed to the next open carrying
 * the last record.
 */

import { computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { Dialog, Drawer, Sheet } from "@upmind/ui";
import { useModulePort } from "../composables/useModulePort";
import {
  ActionPlacementTypes,
  DetailSurfacePositionTypes,
  DetailSurfaceTypes
} from "../scenario.types";
import ActionSlots from "./ActionSlots.vue";
import DetailSurface from "./surfaces/DetailSurface.vue";
import { get, isFunction, noop } from "lodash-es";
import type { ActionSlotItem } from "./ActionSlots.types";
import type { DetailDialogProps } from "./DetailDialog.types";
import type { SurfaceActions } from "./surfaces/surface.types";
import type { ModulePortSnapshot } from "../composables/useModulePort.types";
// -----------------------------------------------------------------------------

const props = defineProps<DetailDialogProps>();

const emit = defineEmits<{
  /** The overlay is done with — dismissed. */
  close: [];
}>();

const { t } = useI18n();

const isDrawer = computed(
  () => props.presentation?.surface !== DetailSurfaceTypes.MODAL
);

const position = computed(
  () => props.presentation?.position ?? DetailSurfacePositionTypes.RIGHT
);

// A side position is a Sheet, not a Drawer: the Drawer is the bottom-sheet
// primitive (rounded top edge, full width, drag handle), so sliding it in from
// an edge yields a bottom sheet wearing a side entrance rather than the
// full-height reading pane a record wants. BOTTOM keeps the Drawer.
const isSide = computed(
  () => isDrawer.value && position.value !== DetailSurfacePositionTypes.BOTTOM
);

const host = computed(() => {
  if (isSide.value) return Sheet;
  return isDrawer.value ? Drawer : Dialog;
});

const side = computed(() => (isSide.value ? position.value : undefined));

// The Sheet carries its own width off `side`; only the hosts with a size scale
// take one.
const size = computed(() => (isSide.value ? undefined : "lg"));

// A side pane is a column: the record scrolls in the middle and the footer sits
// on the bottom edge rather than trailing the last field. The host's own
// container is already `flex-1`, so it only wants a column to grow inside.
const hostClass = computed(() => (isSide.value ? "flex flex-col" : undefined));

const hostClassHeader = computed(() =>
  isSide.value ? "shrink-0 pb-4" : undefined
);

// A pinned footer only holds if the pane is height-bound and the RECORD is what
// scrolls: the side variants are already `inset-y-0 h-full`, so the middle needs
// to be allowed to shrink (`min-h-0`) and take the overflow itself.
const hostClassContent = computed(() =>
  isSide.value ? "min-h-0 flex-1 overflow-y-auto" : undefined
);

const hostClassFooter = computed(() =>
  isSide.value ? "shrink-0 w-full gap-2 pt-4" : undefined
);

/** Close, then the record's own actions — one group, one treatment. */
const footerActions = computed<ActionSlotItem[]>(() => [
  {
    name: "close",
    label: t("action.close"),
    icon: "x-close",
    placement: ActionPlacementTypes.VISIBLE,
    onSelect: () => emit("close")
  },
  ...props.actions
]);

const direction = computed(() =>
  isDrawer.value && !isSide.value ? position.value : undefined
);

// The fetch is booted only where the scenario declares a read composable AND
// the row yielded the id to open it at (`R6-30c`); without both, the clicked
// row's own data is the record and nothing is fetched.
const port =
  props.detail && props.id
    ? useModulePort(props.detail.useDetail, {
        actor: props.detail.actor,
        id: props.id
      })
    : undefined;

const surfaceActions = computed<SurfaceActions>(() => port?.actions ?? {});

// The unifying seam: DetailSurface reads `context.model`, so both feeds are
// normalised to it — the fetch's mapped record (published as `context.data`)
// or the clicked row. The row-data path carries no meta, which reads READY.
const snapshot = computed<ModulePortSnapshot>(() => {
  if (port) {
    const snap = port.snapshot();
    return { ...snap, context: { ...snap.context, model: snap.context.data } };
  }
  return { actions: [], context: { model: props.record }, meta: {} };
});

function onOpen(open: boolean): void {
  if (!open) emit("close");
}

onMounted(() => {
  const isReady = get(port?.actions, "isReady");
  // Dismissing mid-boot destroys the very actor this waits on, so its rejection
  // IS the close — never a failure to report (mirrors ManageDialog).
  if (isFunction(isReady)) Promise.resolve(isReady()).catch(noop);
});

onUnmounted(() => {
  const destroy = get(port?.actions, "destroy");
  if (isFunction(destroy)) destroy();
});
</script>
