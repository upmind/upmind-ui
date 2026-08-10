<template>
  <div v-if="hasChildren">
    <!-- Parent item with children -->
    <button
      :class="[
        'hover:bg-canvas flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        'text-base',
        depth === 0 ? 'text-display' : ''
      ]"
      :style="{ paddingLeft }"
      @click="toggle"
    >
      <Icon
        v-if="item.icon"
        :icon="item.icon"
        size="xs"
        class="text-muted shrink-0"
      />
      <span class="flex-1">{{ item.label }}</span>
      <Icon
        :icon="isOpen ? 'chevron-down' : 'chevron-right'"
        size="2xs"
        class="text-muted shrink-0"
      />
    </button>
    <ul v-if="isOpen" class="mt-1 space-y-1">
      <li v-for="(child, idx) in item.children" :key="idx">
        <NavSection :item="child" :depth="depth + 1" />
      </li>
    </ul>
  </div>

  <!-- Dynamic route - non-navigable label -->
  <div
    v-else-if="item.route && item.dynamic"
    :class="[
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
      'text-faint',
      'cursor-default'
    ]"
    :style="{ paddingLeft }"
  >
    <Icon icon="hash" size="2xs" class="text-faint shrink-0" />
    <span class="italic">{{ item.label }}</span>
  </div>

  <!-- Regular navigable route -->
  <RouterLink
    v-else-if="item.to || item.route"
    :to="item.to ?? { name: item.route! }"
    :class="[
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
      'text-muted hover:bg-canvas hover:text-display',
      isActive ? 'bg-accent-primary-muted text-accent-primary' : ''
    ]"
    :style="{ paddingLeft }"
  >
    <Icon
      v-if="item.icon"
      :icon="item.icon"
      size="xs"
      class="text-muted shrink-0"
    />
    <span>{{ item.label }}</span>
  </RouterLink>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { Icon } from "@upmind-automation/upmind-ui";
import { some, startsWith } from "lodash-es";
import type { NavItem } from "../composables/useNavigation.types";
// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    item: NavItem;
    depth?: number;
  }>(),
  {
    depth: 0
  }
);

const route = useRoute();

// A registry-derived item owns a path rather than a route record, and its
// scope suffix (`/as/:actor/for/:type/:id`) extends that path.
const isItemActive = (item: NavItem): boolean =>
  item.to
    ? startsWith(route.path, item.to)
    : !!item.route && route.name === item.route;

const isActive = computed(() => isItemActive(props.item));

// Check if any child route is currently active
const hasActiveChild = (item: NavItem): boolean => {
  if (isItemActive(item)) {
    return true;
  }
  if (item.children) {
    return some(item.children, child => hasActiveChild(child));
  }
  return false;
};

// Start collapsed by default, but expand if contains active route
const isOpen = ref(hasActiveChild(props.item));

// Watch for route changes to auto-expand when navigating
watch(
  () => route.name,
  () => {
    if (hasActiveChild(props.item)) {
      isOpen.value = true;
    }
  }
);

const toggle = () => {
  if (props.item.children) {
    isOpen.value = !isOpen.value;
  }
};

const hasChildren = computed(
  () => props.item.children && props.item.children.length > 0
);

const paddingLeft = computed(() => `${props.depth * 12 + 8}px`);
</script>
