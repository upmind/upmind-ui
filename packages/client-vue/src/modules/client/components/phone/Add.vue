<template>
  <UpmForm
    :model-value="model"
    :schema="schema"
    :uischema="uischema"
    :renderers="formRenderers"
    @update:modelValue="data => input(data as PhoneModel)"
    @resolve="handleAdd"
    @reject="handleCancel"
  />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import { UpmForm, formRenderers } from "../../../../components/form";
import {
  useClientPhone,
  useClientPhones,
  useBillingDetails,
} from "@upmind-automation/headless-vue";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";

import type { PhoneModel } from "@upmind-automation/headless-vue";
import { Views } from "../../../client/components/billing/types";

const emit = defineEmits<{
  setView: [view: Views];
}>();

const { isReady } = useClientPhones();
const { invalidate: invalidateBillingDetails } = useBillingDetails();
await isReady().catch(() => {
  emit("setView", Views.list);
});

const router = useRouter();
const { update, input, model, schema, uischema } = useClientPhone();

const handleAdd = async () => {
  try {
    await update();
    // Invalidate billing details to refresh the state
    await invalidateBillingDetails();
    emit("setView", Views.list);
  } catch (error) {
    console.error("Failed to add phone:", error);
  }
};

const handleCancel = () => {
  emit("setView", Views.list);
};
</script>
