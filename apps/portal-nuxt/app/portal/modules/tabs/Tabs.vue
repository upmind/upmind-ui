<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />
  <PortalTabs
    v-else
    :tabs="tabItems"
    :variant="props.variant"
    :orientation="props.orientation"
    :model-value="props.selected"
    :ui="{ content: 'empty:hidden' }"
    @update:model-value="onSelect"
  >
    <template
      v-for="tab in meta.paneled"
      :key="tab.value"
      #[`content.${tab.value}`]
    >
      {{ tab.content }}
    </template>
  </PortalTabs>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/tabs/Tabs
 * @description The `tabs` module (tasks.md 5.1, `nav`-tagged), over
 * `@upmind/ui`'s `Tabs`. Tab labels and panel content are config-owned data
 * (`ModuleRef.props`), never hardcoded here.
 *
 * Two roles, one module. Tabs carrying `content` render their own panels, as
 * the boards' tab blocks do. Tabs carrying an `action` are a RAIL over
 * content that lives BELOW them in the row: picking one emits its action and
 * the module changes nothing itself — the route answers, and the selection
 * comes back down as `selected`. Renders; it does not decide.
 *
 * The library's `Tabs` renders one panel per tab unconditionally, so a rail
 * would leave an empty panel under itself; `empty:hidden` collapses a panel
 * with nothing in it — the same rule a row footer follows — and leaves a
 * content-carrying tab's panel alone.
 */
import { EmptyState, Tabs as PortalTabs } from "@upmind/ui";
import { computed } from "vue";
import { filter, find, map } from "lodash-es";
import type { TabsModuleEmits, TabsModuleProps } from "./types";
import type { TabItem } from "@upmind/ui";

defineOptions({ name: "PortalTabsModule" });

const props = defineProps<TabsModuleProps>();

const emit = defineEmits<TabsModuleEmits>();

const meta = computed(() => ({
  isEmpty: props.tabs.length === 0,
  // Only tabs that own content get a panel; a rail's content is the row's.
  paneled: filter(props.tabs, tab => tab.content !== undefined)
}));

const tabItems = computed<TabItem[]>(() =>
  map(props.tabs, tab => ({ value: tab.value, label: tab.label }))
);

function onSelect(value: string | number): void {
  const picked = find(props.tabs, { value: String(value) });
  if (picked?.action === undefined) return;
  emit("select", picked.action);
}
</script>
