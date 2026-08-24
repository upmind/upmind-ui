<template>
  <div v-if="hasChildren">
    <!-- Parent item with children -->
    <button
      :class="[
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
        depth === 0 ? 'text-neutral-900 dark:text-white' : ''
      ]"
      :style="{ paddingLeft }"
      @click="toggle"
    >
      <Icon
        v-if="item.icon"
        :icon="item.icon"
        size="xs"
        class="shrink-0 text-neutral-500"
      />
      <span class="flex-1">{{ item.label }}</span>
      <Icon
        :icon="isOpen ? 'chevron-down' : 'chevron-right'"
        size="2xs"
        class="shrink-0 text-neutral-400"
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
      'text-neutral-400 dark:text-neutral-600',
      'cursor-default'
    ]"
    :style="{ paddingLeft }"
  >
    <Icon
      icon="hash"
      size="2xs"
      class="shrink-0 text-neutral-300 dark:text-neutral-700"
    />
    <span class="italic">{{ item.label }}</span>
  </div>

  <!-- Regular navigable route -->
  <RouterLink
    v-else-if="item.route"
    :to="{ name: item.route }"
    :class="[
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
      'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
    ]"
    :style="{ paddingLeft }"
    active-class="bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400"
  >
    <Icon
      v-if="item.icon"
      :icon="item.icon"
      size="xs"
      class="shrink-0 text-neutral-500"
    />
    <span>{{ item.label }}</span>
  </RouterLink>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { Icon } from "@upmind-automation/client-vue";
import type { NavItem } from "../composables/useNavigation";

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

// Check if any child route is currently active
const hasActiveChild = (item: NavItem): boolean => {
  if (item.route && route.name === item.route) {
    return true;
  }
  if (item.children) {
    return item.children.some(child => hasActiveChild(child));
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
