<template>
  <Tabs v-bind="forwarded">
    <TabsList ref="tabsListRef" :class="styles.tabs.list">
      <TabsTrigger
        v-for="(item, index) in tabs"
        :key="item.value"
        :ref="el => setTriggerRef(el, index)"
        :value="item.value"
        :class="[
          styles.tabs.trigger,
          tabs.length === 1 ? 'cursor-text' : 'cursor-pointer'
        ]"
        :focusable="tabs.length > 1"
      >
        <Icon v-if="item.icon" :icon="item.icon" size="2xs" />
        <span>{{ item.label }}</span>
      </TabsTrigger>

      <div
        v-if="tabs.length > 1 && indicatorStyle"
        :class="styles.tabs.indicator"
        :style="indicatorStyle"
      />
    </TabsList>

    <TabsContent
      v-for="item in tabs"
      :key="item.value"
      :value="item.value"
      :forceMount="item?.eager"
      tabindex="-1"
    >
      <slot :name="`content.${item.value}`"></slot>
    </TabsContent>
  </Tabs>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useForwardPropsEmits } from "radix-vue";
import { useElementBounding } from "@vueuse/core";

// --- internal
import { useStyles } from "../../utils";
import config from "./tabs.config";

// --- components
import Tabs from "./Tabs.vue";
import TabsContent from "./TabsContent.vue";
import TabsList from "./TabsList.vue";
import TabsTrigger from "./TabsTrigger.vue";
import { Icon } from "../icon";

// --- types
import type { ComputedRef } from "vue";
import type { TabsProps, TabItem } from ".";
import type { TabsRootEmits } from "radix-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TabsProps>(), {
  tabs: (): TabItem[] => [],
  defaultValue: "",
  uiConfig: () => ({
    tabs: {
      list: [],
      trigger: []
    }
  }),
  class: ""
});

const emits = defineEmits<TabsRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

// Track tab list and trigger elements for indicator positioning
const tabsListRef = ref<HTMLElement | null>(null);
const triggerRefs = ref<(HTMLElement | null)[]>([]);

// Store trigger refs from template
const setTriggerRef = (el: any, index: number) => {
  if (el) {
    triggerRefs.value[index] = el.$el || el;
  }
};

// Watch for layout changes to update indicator
const { width: listWidth } = useElementBounding(tabsListRef);

const styles = useStyles(
  "tabs",
  {},
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  tabs: {
    list: string;
    trigger: string;
    indicator: string;
  };
}>;

// Find active tab index
const currentTab = computed(() =>
  props.tabs.findIndex(tab => tab.value === forwarded.value.modelValue)
);

// Calculate indicator position and width to match active tab
const indicatorStyle = computed(() => {
  listWidth.value; // Trigger reactivity on layout changes

  const activeTrigger = triggerRefs.value[currentTab.value];
  if (!activeTrigger) return null;

  return {
    transform: `translateX(${activeTrigger.offsetLeft}px)`,
    width: `${activeTrigger.offsetWidth}px`
  };
});
</script>
