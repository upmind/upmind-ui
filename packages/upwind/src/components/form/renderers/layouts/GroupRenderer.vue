<template>
  <fieldset v-if="layout.visible" :class="styles.group.root">
    <div v-if="layout.label" :class="styles.group.label">
      <legend>{{ layout.label }}</legend>
    </div>
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="styles.group.item"
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
  </fieldset>
</template>

<script lang="ts">
import type { Layout } from "@jsonforms/core";
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
} from "@jsonforms/vue";
import { useUpwindLayout } from "../utils";

const layoutRenderer = defineComponent({
  name: "GroupRenderer",
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<Layout>(),
  },
  setup(props: RendererProps<Layout>) {
    return useUpwindLayout(useJsonFormsLayout(props));
  },
});

export default layoutRenderer;

export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("Group")),
};

// export const entry: JsonFormsRendererRegistryEntry = {
//   renderer: layoutRenderer,
//   tester: rankWith(2, and(isLayout, uiTypeIs("Group"))),
// };
</script>
../utils ../utils
