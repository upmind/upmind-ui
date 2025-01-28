<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Tabs v-bind="forwarded">
    <TabsList :class="variants.tabs.list" :color="color" :variant="variant">
      <template v-for="item in tabs" :key="item.value">
        <TabsTrigger
          :value="item.value"
          :class="variants.tabs.trigger"
          :color="props.color"
          :variant="props.variant"
        >
          <slot :name="`trigger.${item.value}`">{{ item.label }}</slot>
        </TabsTrigger>
      </template>
    </TabsList>

    <template v-for="item in tabs" :key="item.value">
      <TabsContent :value="item.value">
        <slot :name="`content.${item.value}`"></slot>
      </TabsContent>
    </template>
  </Tabs>
</template>

<script lang="ts" setup>
// ---external
import { computed } from "vue";
import { useForwardPropsEmits } from "radix-vue";

// ---internal
import {
  useStyles,
  //stylesheet
} from "../../utils";
import config from "./tabs.config";

// --- components
import Tabs from "./Tabs.vue";
import TabsContent from "./TabsContent.vue";
import TabsList from "./TabsList.vue";
import TabsTrigger from "./TabsTrigger.vue";

// --- types
import type { ComputedRef } from "vue";
import type { TabsProps, TabItems } from ".";
import type { TabsRootEmits } from "radix-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TabsProps>(), {
  // --- props
  tabs: (): TabItems[] => [],
  defaultValue: "",
  // -- variants
  color: "base",
  variant: "flat",
  // --- styles
  upmindUIConfig: () => ({
    tabs: {
      list: {},
      trigger: {},
    },
  }),
  class: "",
});

const emits = defineEmits<TabsRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  color: props.color,
  variant: props.variant,
  alignment: props.alignment,
  width: props.width,
}));

const variants = useStyles(
  "tabs",
  meta,
  config,
  props.upmindUIConfig ?? {}
) as ComputedRef<{
  tabs: {
    list: string;
    trigger: string;
  };
}>;
</script>
