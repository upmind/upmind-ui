<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Tabs v-bind="forwarded">
    <TabsList :class="styles.tabs.list">
      <template v-for="item in tabs" :key="item.value">
        <TabsTrigger :value="item.value" :class="styles.tabs.trigger">
          <Icon v-if="item.icon" :icon="item.icon" size="2xs" />
          <slot :name="`trigger.${item.value}`">{{ item.label }}</slot>
          <Badge v-if="item.badge" v-bind="item.badge" size="sm" />
        </TabsTrigger>
      </template>
    </TabsList>

    <template v-for="item in tabs" :key="item.value">
      <TabsContent
        :value="item.value"
        :forceMount="item?.eager"
        tabindex="-1"
        class="mt-0"
      >
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
  useStyles
  //stylesheet
} from "../../utils";
import config from "./tabs.config";

// --- components
import Tabs from "./Tabs.vue";
import TabsContent from "./TabsContent.vue";
import TabsList from "./TabsList.vue";
import TabsTrigger from "./TabsTrigger.vue";
import Icon from "../icon/Icon.ce.vue";
import Badge from "../badge/Badge.ce.vue";

// --- types
import type { ComputedRef } from "vue";
import type { TabsProps } from "./types";
import type { TabItem } from "../tabs/types";
import type { TabsRootEmits } from "radix-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TabsProps>(), {
  // --- props
  tabs: (): TabItem[] => [],
  defaultValue: "",
  // -- styles
  color: "default",
  // --- styles
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

const meta = computed(() => ({
  alignment: props.alignment,
  width: props.width
}));

const styles = useStyles(
  "tabs",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  tabs: {
    list: string;
    trigger: string;
  };
}>;
</script>
