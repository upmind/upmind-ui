<template>
  <aside
    v-if="meta.showsColumn"
    :id="props.paneId"
    :aria-label="props.label"
    data-slot="action-pane"
    :class="ACTION_PANE_COLUMN_CLASS"
  >
    <slot />
  </aside>

  <!-- Below `lg` — and at every width for `hidden` — the SAME slot moves into
       a right-hand sheet. Single mount: exactly one copy of the consumer's
       content lives in the tree at either width. -->
  <Sheet
    v-else
    side="right"
    :open="props.open"
    :title="props.label"
    :close-label="props.closeLabel"
    @update:open="emits('update:open', $event)"
  >
    <aside
      :id="props.paneId"
      :aria-label="props.label"
      data-slot="action-pane"
      :class="ACTION_PANE_DRAWER_CLASS"
    >
      <slot />
    </aside>
  </Sheet>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalActionPane
 * @description The `utility` primitive's surface (tasks.md 3.2): a column in
 * the shell grid's third track at `lg+`, the same content in a right-hand
 * sheet below it. `@upmind/ui` carries no `ActionPane` on this submodule
 * branch, so the portal composes the two branches over the composed `Sheet`
 * and owns the open state through its consumer (`PortalFrame`), never a
 * shell-context registration.
 *
 * The drawer state never survives a breakpoint crossing while the pane is
 * `persistent`: the sheet branch unmounts without emitting, and a stale
 * `true` would remount it open over a column that is already showing.
 */
import { Sheet } from "@upmind/ui";
import { computed, watch } from "vue";
import { ACTION_PANE_VARIANT } from "./types";
import { ACTION_PANE_COLUMN_CLASS, ACTION_PANE_DRAWER_CLASS } from "./variants";
import type { PortalActionPaneEmits, PortalActionPaneProps } from "./types";
import { useLgViewport } from "~/composables/useLgViewport";

defineOptions({ name: "PortalActionPane" });

const props = defineProps<PortalActionPaneProps>();
const emits = defineEmits<PortalActionPaneEmits>();

const isDesktop = useLgViewport();

const meta = computed(() => ({
  showsColumn:
    props.variant === ACTION_PANE_VARIANT.PERSISTENT && isDesktop.value
}));

watch(isDesktop, () => {
  if (props.variant !== ACTION_PANE_VARIANT.PERSISTENT) return;
  emits("update:open", false);
});
</script>
