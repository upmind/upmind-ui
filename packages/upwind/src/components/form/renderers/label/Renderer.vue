<template>
  <upw-label
    v-if="meta.isVisible"
    v-bind="label"
    :requiredText="appliedOptions?.requiredText"
    :optionalText="appliedOptions?.optionalText"
    :hideRequired="appliedOptions?.hideRequired"
    :hideStatus="appliedOptions?.hideStatus"
    :disabled="meta.isDisabled"
    :size="size"
    :upwindConfig="[config, upwindConfig]"
  />
</template>

<script lang="ts">
// --- global
import { computed, defineComponent } from "vue";
import { uiTypeIs } from "@jsonforms/core";
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";

// --- components
import UpwLabel from "../../../label/Label.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindLabelRenderer } from "../utils";
import { useStyles } from "../../../../utils";

// --- types
import type { PropType } from "vue";
import type { LabelElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../controls/types";

// -------------------------------------------------------------------

export default defineComponent({
  name: "LabelRenderer",
  components: {
    UpwLabel,
  },
  props: {
    ...rendererProps<LabelElement>(),
    // ---  Additional Attributes
    size: {
      type: String as PropType<InputProps["size"]>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<LabelElement>) {
    const meta = computed(() => ({
      isVisible: renderer.label.value.visible,
      isDisabled: !renderer.label.value.enabled,
    }));

    const styles = useStyles(["label"], meta, config, props.upwindConfig);
    const renderer = useUpwindLabelRenderer(useJsonFormsLabel(props));
    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
      meta,
      styles,
      config, // pass the config to the  component
    };
  },
});

export const tester = {
  rank: 1,
  controlType: uiTypeIs("Label"),
};
</script>
