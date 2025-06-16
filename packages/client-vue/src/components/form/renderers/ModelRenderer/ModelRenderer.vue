<template>
  <Dialog
    v-model:open="open"
    size="3xl"
    :title="`${id ? 'Edit' : 'New'} ${label}`"
  >
    <template v-if="isLoading">
      <ModelRendererSkeleton />
    </template>
    <UpmForm
      v-else
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-renderers="formRenderers"
      color="secondary"
      @update:modelValue="doInput"
      @resolve="doResolve"
      @reject="close"
      :processing="isProcessing"
    >
      <template #actions="{ doReject, doResolve }">
        <ModelRendererActions
          :disabled="isProcessing || !isTouched"
          :loading="isProcessing || isLoading"
          @save="doResolve"
          @cancel="doReject"
        />
      </template>
    </UpmForm>
  </Dialog>
</template>

<script setup lang="ts">
// --- external
import { ref, onMounted } from "vue";

// --- components
import { UpmForm, formRenderers } from "../../../form";
import { Dialog } from "@upmind-automation/upmind-ui";
import ModelRendererSkeleton from "./ModelRendererSkeleton.vue";
import ModelRendererActions from "./ModelRendererActions.vue";
import { utils } from "@upmind-automation/headless";

// --- types
import type { ModelRendererProps } from "./types";

const props = defineProps<ModelRendererProps>();

const open = ref(true);
const isLoading = ref(true);
const isProcessing = ref(false);
const isTouched = ref(false);

const { DEBOUNCE_DELAY } = utils;

const { model, isReady, update, clear, input, schema, uischema } =
  props.composable(props.id);

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
  close();
};

const doInput = (value: any) => {
  isTouched.value = true;
  input(value);
};

const close = () => {
  open.value = false;
  setTimeout(() => {
    clear();
    isProcessing.value = false;
  }, DEBOUNCE_DELAY);
};
</script>
