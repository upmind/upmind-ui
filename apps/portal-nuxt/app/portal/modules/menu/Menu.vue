<template>
  <!-- Hidden below `lg`, the counterpart to the `bottom` primitive's own
       `lg:hidden` (PortalFrame's `#bottom`): below that breakpoint the two
       reserve the SAME primary-nav duty, and an unbroken horizontal item row
       has nowhere to shrink into at a phone width (X2). -->
  <!-- `link-as` routes every item through NuxtLink — a bare anchor here is a
       full document navigation, while the vertical rail below already rides
       `:as="NuxtLink"`. -->
  <NavigationMenu
    v-if="meta.isHorizontal"
    :items="navigationMenuItems"
    :aria-label="props.navLabel"
    :link-as="NuxtLink"
    class="hidden lg:flex"
    :ui="{ link: meta.emphasisClass }"
  />

  <!-- The vertical rail carries its OWN navigation landmark. It used to rely
       on `ShellSidebar` for one, which holds only where the menu sits in the
       shell sidebar: an `inline` utility pane renders into the page's aside
       instead, so that rail had no landmark at all and answered to the
       aside's name. Naming each list also separates the two a sidebar
       stacks (a brand's main nav and its billing nav). -->
  <nav v-else :aria-label="props.navLabel" class="flex min-h-0 flex-col">
    <SidebarNavRoot :collapsed="props.collapsed">
      <template v-for="item in props.items" :key="item.to ?? item.label">
        <SidebarNavLink
          v-if="item.to"
          :as="NuxtLink"
          :to="item.to"
          :icon="item.icon"
          :active="isActive(item.to)"
        >
          {{ item.label }}
        </SidebarNavLink>
        <!-- An EXTERNAL destination is a real anchor, never NuxtLink: the
             brand's own storefront is a document away, not a route. -->
        <SidebarNavLink
          v-else-if="item.href"
          :href="item.href"
          :icon="item.icon"
        >
          {{ item.label }}
        </SidebarNavLink>
        <!-- A destination-less item is a group LABEL over its children —
             never a link, never active (types.ts `MenuItem.to`). -->
        <p
          v-else
          v-show="!props.collapsed"
          class="text-muted flex items-center gap-2 px-3 pt-3 pb-1 text-xs font-medium"
        >
          <component :is="item.icon" v-if="item.icon" class="size-4" />
          {{ item.label }}
        </p>
        <!-- A parent's own children render INDENTED beneath it, which is what
           legacy's side menus drew (My invoices → Paid/Unpaid/Credited,
           Affiliate → Overview/…). Collapsed, the rail is icons only, so the
           indented level is suppressed with its labels. -->
        <SidebarNavLink
          v-for="child in childrenOf(item)"
          v-show="!props.collapsed"
          :key="child.to ?? child.label"
          :as="NuxtLink"
          :to="child.to"
          :icon="child.icon"
          :active="isActive(child.to)"
          class="ps-6"
        >
          {{ child.label }}
        </SidebarNavLink>
      </template>
    </SidebarNavRoot>
  </nav>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/menu/Menu
 * @description The `menu` module (tasks.md 2.7, `nav`-tagged) — the route
 * list. `default` renders `SidebarNavRoot`/`SidebarNavLink`, a vertical rail
 * (design.md §D2 consequence: PortalFrame's own doc comment states navigation
 * comes from `shell` alone). `horizontal` (tasks.md 5.1) renders
 * `@upmind/ui`'s `NavigationMenu` instead — the vertical rail overlapping a
 * 44px sub-bar track is the measured defect this variant fixes. Items are
 * config-owned data (`ModuleRef.props`), read as a prop and never hardcoded
 * here, so a later config (Task 6) renders its own labels. `collapsed` is a
 * real prop threaded by `PortalSlotContent` from `ShellSidebar`'s own slot
 * scope — never `injectShellContext`, which reports the RAIL's state and is
 * wrong for the mobile drawer (a drawer is never a rail). `dropdown`/`mega`
 * variants stay unimplemented (registry.ts).
 */
import { NavigationMenu, SidebarNavRoot, SidebarNavLink } from "@upmind/ui";
import { computed, resolveComponent } from "vue";
import { navEmphasisClass } from "../../variants";
import { MENU_VARIANT } from "./types";
import { every, filter, flatMap, map, max } from "lodash-es";
import type { MenuItem, MenuProps } from "./types";
import type { NavigationMenuItemData } from "@upmind/ui";

defineOptions({ name: "PortalMenu" });

/** A parent's own child destinations — legacy's second menu level (types.ts `MenuItem.children`). */
function childrenOf(item: MenuItem): readonly MenuItem[] {
  return item.children ?? [];
}

const props = defineProps<MenuProps>();

const route = useRoute();
// resolveComponent, not a `#components` import — that virtual module is Nuxt-build-only and the plain vitest config here does not provide it.
const NuxtLink = resolveComponent("NuxtLink");

/**
 * The query keys THIS menu's own destinations pin — derived from the items it
 * was given, never named here. A bare destination yields to a query on one of
 * these (otherwise "All" and every filter of the same path light together),
 * but a key no item mentions — a listing's own status tab, say — is another
 * control's state and leaves the menu's selection alone.
 */
const ownedQueryKeys = computed(() => {
  const keys = new Set<string>();
  for (const item of props.items) {
    for (const destination of [item, ...childrenOf(item)]) {
      const search = destination.to?.split("?")[1];
      for (const [key] of new URLSearchParams(search)) keys.add(key);
    }
  }
  return keys;
});

/** Every path THIS menu's own destinations point at — what a prefix match yields to. */
const ownedPaths = computed(() =>
  map(
    [...props.items, ...flatMap(props.items, childrenOf)],
    item => item.to?.split("?")[0] ?? ""
  )
);

/**
 * On segment boundaries, never bare text: "/products" covers
 * "/products/prod-1" but not "/products-archive". "/" covers only itself, or
 * the dashboard would light on every route.
 */
function covers(path: string) {
  if (path === "/") return route.path === "/";
  return route.path === path || route.path.startsWith(`${path}/`);
}

/**
 * Query-aware: a destination pinning query params ("?type=sub") is active
 * only while the route carries them, and a BARE destination yields while any
 * query the menu OWNS applies.
 */
function isActive(to: string | undefined) {
  if (to === undefined) return false;
  const [path = "", search] = to.split("?");
  if (!covers(path)) return false;

  // A sibling that covers MORE of the route owns the selection: at
  // /products/order both "/products" and "/products/order" cover it, and only
  // the longer one is where the reader actually is.
  const deepest = max(
    map(filter(ownedPaths.value, covers), owned => owned.length)
  );
  if (deepest !== undefined && path.length < deepest) return false;

  const pinned = [...new URLSearchParams(search).entries()];
  if (pinned.length === 0) {
    return every(
      [...ownedQueryKeys.value],
      key => route.query[key] === undefined
    );
  }
  return every(pinned, ([key, value]) => route.query[key] === value);
}

const meta = computed(() => ({
  isHorizontal: props.variant === MENU_VARIANT.HORIZONTAL,
  emphasisClass: navEmphasisClass(props.emphasis)
}));

function toPanelLinks(item: MenuItem): NavigationMenuItemData["links"] {
  if (!item.children || item.children.length === 0) return undefined;
  // A group-label child always carries a destination in practice; the guard
  // narrows the optional `to` for the panel link's required href.
  const linked = filter(
    item.children,
    (child): child is MenuItem & { to: string } => child.to !== undefined
  );
  return map(linked, child => ({
    label: child.label,
    href: child.to,
    active: isActive(child.to)
  }));
}

// `NavigationMenu` prefers `links` over `href` for the same item (its own
// `v-if="item.links"`), so a flat item's `href` is simply unread once a
// panel item's `links` are present — no branch needed here to pick one.
const navigationMenuItems = computed<NavigationMenuItemData[]>(() =>
  map(props.items, item => ({
    label: item.label,
    href: item.href ?? item.to,
    active: isActive(item.to),
    links: toPanelLinks(item)
  }))
);
</script>
