<template>
  <ModelListRendererContent
    v-if="formFieldProps.visible && (initialised || selectOnly)"
    v-bind="props"
  />
</template>

<script setup lang="ts">
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ModelListRendererContent from "./ModelListRendererContent.vue";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- utils
import { get, isFunction } from "lodash-es";

// --- types
import type { RendererProps } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import { computed, ref, watch } from "vue";

const props = defineProps<RendererProps<ControlElement>>();

const initialised = ref(false);

const { formFieldProps, control } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

const hasComposable = computed(() => {
  return isFunction(get(control.value.uischema, "options.composable"));
});

watch(
  hasComposable,
  async () => {
    if (hasComposable.value) {
      const { isReady } = get(control.value.uischema, "options.composable")();
      initialised.value = await isReady();
    }
  },
  { immediate: true, deep: true }
);

const selectOnly = computed(() => {
  return get(control.value.uischema, "options.selectOnly");
});
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("ModelList")),
};
</script>
