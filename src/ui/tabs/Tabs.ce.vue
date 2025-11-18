<template>
  <Tabs v-bind="forwarded" v-model="modelValue" :class="class">
    <div :class="styles.tabs.root">
      <div v-if="!isEmptySlot('prepend', slots)" :class="styles.tabs.prepend">
        <slot name="prepend" />
      </div>

      <TabsList ref="tabsListRef" :class="styles.tabs.list">
        <template v-if="tabs.length > 1 || force">
          <TabsTrigger
            v-for="(item, index) in tabs"
            :key="item.value"
            :ref="el => setTriggerRef(el, index)"
            :value="item.value"
            :class="[styles.tabs.trigger, 'cursor-pointer']"
          >
            <Icon
              v-if="item.icon"
              :icon="item.icon"
              size="2xs"
              :class="styles.tabs.icon"
            />
            <span>{{ item.label }}</span>
          </TabsTrigger>
        </template>
        <template v-else>
          <div
            :key="first(tabs)?.value"
            :class="[styles.tabs.trigger, 'cursor-text']"
            data-state="active"
          >
            <Icon
              v-if="first(tabs)?.icon"
              :icon="first(tabs)?.icon ?? ''"
              :class="styles.tabs.icon"
              size="2xs"
            />
            <span>{{ first(tabs)?.label }}</span>
          </div>
        </template>

        <div
          v-if="
            (tabs.length > 1 || force) &&
            indicatorStyle &&
            props.variant === TABS_VARIANTS.MINIMAL
          "
          :class="styles.tabs.indicator"
          :style="indicatorStyle"
        />
      </TabsList>

      <div v-if="!isEmptySlot('append', slots)" :class="styles.tabs.append">
        <slot name="append" />
      </div>
    </div>

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
import { computed, ref, useSlots } from "vue";
import { useForwardPropsEmits } from "radix-vue";
import { useElementBounding } from "@vueuse/core";

// --- internal
import { useStyles } from "../../utils";
import config from "./tabs.config";
import { useVModel } from "@vueuse/core";

// --- components
import Tabs from "./Tabs.vue";
import TabsContent from "./TabsContent.vue";
import TabsList from "./TabsList.vue";
import TabsTrigger from "./TabsTrigger.vue";
import { Icon } from "../icon";

// --- utils
import { first } from "lodash-es";
import { isEmptySlot } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
import type { TabsProps, TabItem } from ".";
import type { TabsRootEmits } from "radix-vue";
import { TABS_VARIANTS } from ".";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TabsProps>(), {
  class: "",
  tabs: (): TabItem[] => [],
  defaultValue: "",
  border: true,
  variant: "minimal",
  uiConfig: () => ({
    tabs: {
      root: [],
      list: [],
      trigger: [],
      indicator: [],
      icon: []
    }
  })
});

const emits = defineEmits<TabsRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);
const slots = useSlots();
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue || first(props.tabs)?.value
});

// Track tab list and trigger elements for indicator positioning
const tabsListRef = ref<HTMLElement | null>(null);
const triggerRefs = ref<(HTMLElement | null)[]>([]);

const meta = computed(() => ({
  variant: props.variant,
  align: props.align,
  overflow: props.overflow,
  hasBorder: props.border
}));

const styles = useStyles(
  "tabs",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  tabs: {
    root: string;
    list: string;
    trigger: string;
    indicator: string;
    icon: string;
    prepend: string;
    append: string;
  };
}>;

// Store trigger refs from template
const setTriggerRef = (el: any, index: number) => {
  if (el) {
    triggerRefs.value[index] = el.$el || el;
  }
};

// Watch for layout changes to update indicator
const { width: listWidth } = useElementBounding(tabsListRef);

const currentTab = computed(() =>
  props.tabs.findIndex(tab => tab.value === modelValue.value)
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
