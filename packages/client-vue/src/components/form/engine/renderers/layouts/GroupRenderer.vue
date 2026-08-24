<template>
  <fieldset v-if="layout.visible" :class="groupRootVariants({ hasBorder })">
    <div v-if="layout.label" :class="groupLabelVariants()">
      <legend>{{ layout.label }}</legend>
    </div>
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="groupItemVariants()"
    >
      <DispatchRenderer
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

<script setup lang="ts">
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";
import { computed } from "vue";
import {
  groupRootVariants,
  groupLabelVariants,
  groupItemVariants
} from "./layouts.variants";
import { useUpmindUILayoutRenderer } from "../utils";
import type { Layout } from "@jsonforms/core";
// -------------------------------------------------------------------

const props = defineProps({ ...rendererProps<Layout>() });

const { layout, appliedOptions } = useUpmindUILayoutRenderer(
  useJsonFormsLayout(props)
);

const hasBorder = computed(() => appliedOptions.value?.border ?? true);
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("Group"))
};
</script>
