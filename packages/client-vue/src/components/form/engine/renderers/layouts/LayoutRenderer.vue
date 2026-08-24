<template>
  <div v-if="layout.visible" :class="layoutRootVariants({ isHorizontal })">
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="layoutItemVariants({ isHorizontal })"
    >
      <DispatchRenderer
        :schema="layout.schema"
        :uischema="element"
        :path="layout.path"
        :enabled="layout.enabled"
        :renderers="layout.renderers"
        :pristine="props.pristine"
        :cells="layout.cells"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { isLayout } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";
import { computed } from "vue";
import { layoutRootVariants, layoutItemVariants } from "./layouts.variants";
import { useUpmindUILayoutRenderer } from "../utils";
import type { Layout } from "@jsonforms/core";
// -------------------------------------------------------------------

const props = defineProps({
  ...rendererProps<Layout>(),
  pristine: { type: Boolean, default: false }
});

const { layout } = useUpmindUILayoutRenderer(useJsonFormsLayout(props));

const isHorizontal = computed(() => layout.value.direction === "row");
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: isLayout };
</script>
