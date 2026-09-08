<template>
  <nav
    :aria-label="props.label"
    data-slot="bottom-nav"
    :class="BOTTOM_NAV_CLASS"
    v-bind="useTestAttrs({ key: 'bottom-nav' })"
  >
    <ul :class="BOTTOM_NAV_LIST_CLASS">
      <li
        v-for="item in props.items"
        :key="item.label"
        :class="BOTTOM_NAV_CELL_CLASS"
      >
        <NuxtLink
          :to="item.to"
          :class="bottomNavItemClass(isActive(item.to))"
          :aria-current="ariaCurrent(item.to)"
          v-bind="useTestAttrs({ key: 'bottom-nav-item', value: item.label })"
        >
          <component
            :is="item.icon"
            :class="BOTTOM_NAV_ICON_CLASS"
            aria-hidden="true"
          />
          <span :class="BOTTOM_NAV_LABEL_CLASS">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/bottom-nav/BottomNavModule
 * @description The `bottom-nav` module (tasks.md 3.3, `nav`-tagged) — the
 * `bottom` primitive's curated destination strip. `@upmind/ui` ships no
 * `BottomNav` on this submodule branch, so the bar is composed here from a
 * plain list of links wearing the library bar's own classes (variants.ts,
 * ui-gaps.md). Items are config-owned data (`ModuleRef.props`), read as a
 * prop and never hardcoded here. `active` is derived the same way `menu`
 * derives it, from the current route — never from a second, drifting source.
 */
import { useTestAttrs } from "@upmind/ui";
import { resolveComponent } from "vue";
import {
  BOTTOM_NAV_CELL_CLASS,
  BOTTOM_NAV_CLASS,
  BOTTOM_NAV_ICON_CLASS,
  BOTTOM_NAV_LABEL_CLASS,
  BOTTOM_NAV_LIST_CLASS,
  bottomNavItemClass
} from "./variants";
import type { BottomNavModuleProps } from "./types";

defineOptions({ name: "PortalBottomNav" });

const props = defineProps<BottomNavModuleProps>();

const route = useRoute();
// resolveComponent, not a `#components` import — that virtual module is Nuxt-build-only and the plain vitest config here does not provide it.
const NuxtLink = resolveComponent("NuxtLink");

function isActive(to: string): boolean {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
}

function ariaCurrent(to: string): "page" | undefined {
  if (isActive(to)) return "page";
  return undefined;
}
</script>
