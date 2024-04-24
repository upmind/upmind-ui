<template>
  <div v-if="layout.visible" :class="styles.layout.root">
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="styles.layout.item"
    >
      <dispatch-renderer
        :schema="layout.schema"
        :uischema="element"
        :path="layout.path"
        :enabled="layout.enabled"
        :renderers="layout.renderers"
        :cells="layout.cells"
      />
    </div>
  </div>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent } from "vue";
import { isLayout } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
} from "@jsonforms/vue";

// --- local
import config from "./config.cva";
// ---utils
import { useUpwindLayoutRenderer } from "../utils";
import { useStyles } from "../../../../utils";

// --- types
import type { PropType } from "vue";
import type { Layout } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../controls/types";

// -------------------------------------------------------------------

export default defineComponent({
  name: "LayoutRenderer",
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<Layout>(),
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
  setup(props: RendererProps<Layout>) {
    const meta = computed(() => ({
      isVisible: renderer.layout.value.visible,
      isDisabled: !renderer.layout.value.enabled,
      isHorizontal: renderer.layout.value.direction === "row",
    }));

    const styles = useStyles(["layout"], meta, config, props.upwindConfig);
    const renderer = useUpwindLayoutRenderer(useJsonFormsLayout(props));
    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
      meta,
      styles,
      config, // pass the config to the  component
    };
  },
});

export const tester = { rank: 1, controlType: isLayout };
</script>
