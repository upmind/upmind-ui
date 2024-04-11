<template>
  <div v-if="layout.visible" :class="layoutClassObject.root">
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="layoutClassObject.item"
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
import type { Layout } from "@jsonforms/core";
import { isLayout } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
} from "@jsonforms/vue";
import { useprelineLayout } from "../utils";

const layoutRenderer = defineComponent({
  name: "LayoutRenderer",
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<Layout>(),
  },
  setup(props: RendererProps<Layout>) {
    return useprelineLayout(useJsonFormsLayout(props));
  },
  computed: {
    layoutClassObject(): any {
      return this.layout.direction === "row"
        ? this.styles.horizontalLayout
        : this.styles.verticalLayout;
    },
  },
});

export default layoutRenderer;

export const tester = { rank: 1, controlType: isLayout };

// export const entry: JsonFormsRendererRegistryEntry = {
//   renderer: layoutRenderer,
//   tester: rankWith(1, isLayout),
// };
</script>
