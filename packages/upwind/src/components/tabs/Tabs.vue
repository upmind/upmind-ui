<template>
  <nav :class="styles.tabs.root" role="tablist">
    <upw-tab
      v-for="tab in tabs"
      v-bind="tab"
      :key="tab.value"
      :active="active == tab.value"
      @click="doChange(tab.value)"
      :disabled="meta.isDisabled || tab?.disabled"
      :size="size"
      :stretch="stretch"
    />
  </nav>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, ref } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwTab from "./Tab.vue";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { TabProps, TabsProps } from "./types";
import { first } from "lodash-es";

// ----------------------------------------------

export default defineComponent({
  name: "UpwLabel",
  inheritAttrs: false,
  emits: ["update:modelValue"],
  components: {
    UpwTab,
  },

  props: {
    tabs: {
      required: true,
      type: Array as PropType<Array<TabProps>>,
    },
    modelValue: { type: String as PropType<TabProps["id"]> },
    disabled: { type: Boolean },
    // ---
    size: { type: String as PropType<TabProps["size"]> },
    align: { type: String as PropType<TabsProps["align"]>, default: "start" },
    block: { type: Boolean },
    stretch: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object] },
  },

  setup(props) {
    const meta = computed(() => ({
      align: props.align,
      // ---
      isDisabled: props.disabled,
      isBlock: props.block,
    }));

    const styles = useStyles("tabs", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
      active: ref(props.modelValue || first(props.tabs)?.value),
    };
  },

  computed: {},

  methods: {
    doChange(value: string) {
      this.active = value;
      this.$emit("update:modelValue", value);
    },
  },
});
</script>
