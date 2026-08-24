<template>
  <div v-if="hasChildren && !collapsed">
    <!-- Parent item with children (expanded sidebar) -->
    <Button
      variant="ghost"
      color="neutral"
      size="sm"
      block
      align="left"
      :icon="item.icon"
      :icon-append="isOpen ? 'chevron-down' : 'chevron-right'"
      :label="item.label"
      :class="depth === 0 ? 'text-display' : ''"
      :style="{ paddingLeft }"
      @click="toggle"
    />
    <ul v-if="isOpen" class="mt-1 space-y-1">
      <li v-for="(child, idx) in item.children" :key="idx">
        <NavSection :item="child" :depth="depth + 1" :collapsed="collapsed" />
      </li>
    </ul>
  </div>

  <!-- Collapsed rail: icon-only with tooltip -->
  <TooltipRoot v-else-if="collapsed && depth === 0">
    <TooltipTrigger as-child>
      <Button
        v-if="item.to || item.route"
        variant="ghost"
        color="neutral"
        size="sm"
        icon-only
        :icon="item.icon ?? 'circle'"
        :to="item.to ?? { name: item.route! }"
        :class="isActive ? 'bg-accent-primary-muted text-accent-primary' : ''"
        :aria-label="item.label"
        :aria-current="isActive ? 'page' : undefined"
      />
      <Button
        v-else-if="hasChildren"
        variant="ghost"
        color="neutral"
        size="sm"
        icon-only
        :icon="item.icon ?? 'folder'"
        :aria-label="item.label"
      />
    </TooltipTrigger>
    <TooltipContent side="right">{{ item.label }}</TooltipContent>
  </TooltipRoot>

  <!-- Dynamic route - non-navigable label -->
  <Button
    v-else-if="item.route && item.dynamic"
    variant="ghost"
    color="neutral"
    size="sm"
    block
    align="left"
    disabled
    icon="hash"
    :label="item.label"
    class="italic"
    :style="{ paddingLeft }"
  />

  <!-- Regular navigable route -->
  <Button
    v-else-if="item.to || item.route"
    variant="ghost"
    color="neutral"
    size="sm"
    block
    align="left"
    :to="item.to ?? { name: item.route! }"
    :icon="item.icon"
    :label="item.label"
    :class="isActive ? 'bg-accent-primary-muted text-accent-primary' : ''"
    :style="{ paddingLeft }"
  />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  Button,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent
} from "@upmind/ui";
import { some, startsWith } from "lodash-es";
import type { NavItem } from "../composables/useNavigation.types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    item: NavItem;
    depth?: number;
    collapsed?: boolean;
  }>(),
  {
    depth: 0,
    collapsed: false
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
