<template>
  <nav ref="root" :aria-label="props.label" class="flex min-h-0 flex-col">
    <SidebarNavRoot :collapsed="props.collapsed">
      <SidebarNavLink
        v-if="meta.isNested"
        as="button"
        type="button"
        :icon="ChevronLeft"
        :aria-label="`${props.backLabel} ${meta.parentLabel}`"
        v-bind="useTestAttrs({ key: SIDEBAR_NAV_BACK_KEY })"
        @click="leaveLevel"
      >
        {{ meta.parentLabel }}
      </SidebarNavLink>

      <template v-for="item in meta.items" :key="item.label">
        <SidebarNavLink
          v-if="hasChildren(item)"
          as="button"
          type="button"
          :icon="item.icon"
          v-bind="
            useTestAttrs({ key: SIDEBAR_NAV_LINK_KEY, value: item.label })
          "
          @click="enterLevel(item.label)"
        >
          {{ item.label }}
        </SidebarNavLink>
        <SidebarNavLink
          v-else
          :as="NuxtLink"
          :to="item.to"
          :icon="item.icon"
          :active="isActive(item.to)"
          v-bind="
            useTestAttrs({ key: SIDEBAR_NAV_LINK_KEY, value: item.label })
          "
        >
          {{ item.label }}
        </SidebarNavLink>
      </template>
    </SidebarNavRoot>
  </nav>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalSidebarNav
 * @description The sidebar's `nested` variant (tasks.md 3.4): one level of a
 * menu tree at a time, with a back row above the level it drilled into.
 * `@upmind/ui`'s `SidebarNav` is flat on this submodule branch — one list
 * from one `items` array, with no drill-down, back row or focus machinery —
 * so the rail is composed here from `SidebarNavRoot` / `SidebarNavLink` and
 * owns the level itself (ui-gaps.md).
 *
 * `path` is the CONSUMER's (PortalFrame binds it): `ShellSidebar` swaps this
 * content between the desktop rail and the mobile drawer with a `v-if`/`v-else`
 * pair, and an uncontrolled level would reset to the top on every crossing.
 *
 * Focus follows the level and comes back to the row that opened it — a
 * drill-down leaving focus on a row that no longer renders strands the
 * keyboard at the top of the document. It runs on a post-flush watcher
 * because the row to focus does not exist until the level has rendered.
 */
import { SidebarNavLink, SidebarNavRoot, useTestAttrs } from "@upmind/ui";
import { ChevronLeft } from "lucide-vue-next";
import { computed, ref, resolveComponent, useTemplateRef, watch } from "vue";
import { SIDEBAR_NAV_BACK_KEY, SIDEBAR_NAV_LINK_KEY } from "./types";
import { find, initial, last } from "lodash-es";
import type {
  PortalSidebarNavEmits,
  PortalSidebarNavFocus,
  PortalSidebarNavProps
} from "./types";
import type { MenuItem } from "../modules/menu/types";

defineOptions({ name: "PortalSidebarNav" });

const props = defineProps<PortalSidebarNavProps>();
const emits = defineEmits<PortalSidebarNavEmits>();

const route = useRoute();
// resolveComponent, not a `#components` import — that virtual module is Nuxt-build-only and the plain vitest config here does not provide it.
const NuxtLink = resolveComponent("NuxtLink");

const root = useTemplateRef<HTMLElement>("root");

/** The row to put focus on once the next level has rendered — a command, not state. */
const pendingFocus = ref<PortalSidebarNavFocus | undefined>(undefined);

function hasChildren(item: MenuItem): boolean {
  return (item.children?.length ?? 0) > 0;
}

/** A destination-less item is a group label, and never lights (menu/types.ts). */
function isActive(to: string | undefined): boolean {
  if (to === undefined) return false;
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
}

/** The level `path` names, walked from the root one label at a time. */
const meta = computed(() => {
  let items: readonly MenuItem[] = props.items;
  for (const label of props.path) {
    items = find(items, { label })?.children ?? [];
  }
  return {
    items,
    isNested: props.path.length > 0,
    parentLabel: last(props.path) ?? ""
  };
});

function enterLevel(label: string): void {
  emits("update:path", [...props.path, label]);
  pendingFocus.value = { kind: "back" };
}

function leaveLevel(): void {
  const parent = last(props.path);
  emits("update:path", initial(props.path));
  if (parent === undefined) return;
  pendingFocus.value = { kind: "row", label: parent };
}

function focusTarget(target: PortalSidebarNavFocus): HTMLElement | null {
  const container = root.value;
  if (container === null) return null;
  if (target.kind === "back") {
    return container.querySelector(`[data-test-key="${SIDEBAR_NAV_BACK_KEY}"]`);
  }
  return container.querySelector(
    `[data-test-key="${SIDEBAR_NAV_LINK_KEY}"][data-test-value="${target.label}"]`
  );
}

watch(
  pendingFocus,
  target => {
    if (target === undefined) return;
    focusTarget(target)?.focus();
    pendingFocus.value = undefined;
  },
  { flush: "post" }
);
</script>
