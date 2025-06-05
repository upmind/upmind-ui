<template>
  <FormField v-bind="formFieldProps">
    <Dialog v-model:open="open" size="2xl">
      <template v-if="isLoading">
        <ModelRendererSkeleton />
      </template>
      <UpmForm
        v-else
        :model-value="model"
        :schema="schema()"
        :uischema="uischema()"
        :additional-renderers="formRenderers"
        color="secondary"
        @update:modelValue="input"
        @resolve="doResolve"
        @reject="doReject"
        :processing="isProcessing"
      >
        <template #actions="{ doReject, doResolve }">
          <ModelRendererActions
            :disabled="isProcessing"
            @save="doResolve"
            @cancel="doReject"
          />
        </template>
      </UpmForm>
    </Dialog>
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { ref, computed, onMounted } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import { UpmForm, formRenderers } from "../../../form";
import {
  useUpmindUIRenderer,
  Dialog,
  FormField,
} from "@upmind-automation/upmind-ui";
import ModelRendererSkeleton from "./ModelRendererSkeleton.vue";
import ModelRendererActions from "./ModelRendererActions.vue";

// --- utils
import { useSchemaComposable } from "../utils";

// --- types
import type { RendererProps } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

const open = ref(true);
const isLoading = ref(true);
const isProcessing = ref(false);

const { getModel, isReady, update, input, schema, uischema, clear } =
  useSchemaComposable(control);
const model = computed(() => getModel());

onMounted(async () => {
  const startTime = Date.now();
  await isReady();

  // Ensure skeleton shows for at least 1 second
  const elapsedTime = Date.now() - startTime;
  const remainingTime = Math.max(0, 1000 - elapsedTime);

  if (remainingTime > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingTime));
  }

  isLoading.value = false;
});

const doResolve = async () => {
  isProcessing.value = true;
  await update();
  onInput(null, false);
  clear();
  isProcessing.value = false;
};

const doReject = () => {
  clear();
  onInput(null, false);
};
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("Model")),
};
</script>
