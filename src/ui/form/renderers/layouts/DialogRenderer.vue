<template>
  <Dialog v-model:open="layout.visible" size="2xl" :title="layout.label">
    <DispatchRenderer
      v-for="(element, index) in layout.uischema.elements"
      :key="index"
      :schema="layout.schema"
      :uischema="element"
      :path="layout.path"
      :enabled="layout.enabled"
      :renderers="layout.renderers"
      :cells="layout.cells"
    />
  </Dialog>
</template>

<script setup lang="ts">
// --- external
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";
// --- components
import { Dialog } from "../../../dialog";
// --- types
import type { Layout } from "@jsonforms/core";
// -------------------------------------------------------------------

const props = defineProps({
  ...rendererProps<Layout>()
});

const { layout } = useJsonFormsLayout(props);
</script>

<script lang="ts">
import { uiTypeIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: uiTypeIs("Dialog")
};
</script>
