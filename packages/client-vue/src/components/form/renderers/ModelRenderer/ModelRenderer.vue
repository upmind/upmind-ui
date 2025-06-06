<template>
  <FormField v-bind="formFieldProps" label="">
    <Dialog v-model:open="open" size="2xl" :title="formFieldProps.label">
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
        @update:modelValue="doInput"
        @resolve="doResolve"
        @reject="doReject"
        :processing="isProcessing"
      >
        <template #actions="{ doReject, doResolve }">
          <ModelRendererActions
            :disabled="isProcessing || !isTouched"
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
const isTouched = ref(false);

const { getModel, isReady, update, schema, uischema, clear } =
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
  open.value = false;
  setTimeout(() => {
    clear();
    isProcessing.value = false;
    onInput(null, false);
  }, 300);
};

const doInput = (value: any) => {
  isTouched.value = true;
  onInput(value, true);
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
