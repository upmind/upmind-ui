<template>
  <UpmForm
    :model-value="model"
    @update:modelValue="(data: any) => updateModel(data)"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    :noActions="!showAddressFields"
  >
    <template #actions v-bind="{ meta }">
      <Button
        type="submit"
        :disabled="meta.isProcessing || !meta.isValid"
        :loading="meta.isLoading"
        color="secondary"
        @click="updateAddress"
      >
        Save details
      </Button>
    </template>
  </UpmForm>
</template>

<script setup lang="ts">
// --- external
import { watch } from "vue";

// --- internal
import {
  useClientAddress,
  useClientAddresses,
} from "@upmind-automation/headless-vue";

// --- components
import { UpmForm, formRenderers } from "../../../../components/form";
import { Button } from "@upmind-automation/upmind-ui";
import { useAddressFields } from "../../../../components/form/composables/useAddressFields";

// --- types
import type { Address } from "@upmind-automation/headless-vue";
import { Views } from "./types";

// utils
import { debounce } from "lodash-es";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { update, set, model, schema, uischema, meta } = useClientAddress();
const { isReady, getAll, data } = useClientAddresses();
const { showAddressFields, selectedAddress, setShowAddressFields } =
  useAddressFields();

await isReady().then(async () => {
  await getAll();
});

const updateModel = debounce(async (address: Address) => {
  if (showAddressFields.value) {
    await set(address.address);
  }
}, 500);

watch(selectedAddress, async address => {
  try {
    if (address) {
      await set(address);
      await updateAddress();
    }
  } catch (error) {
    // Show the address input fields if the address lookup update fails
    setShowAddressFields(true);
    throw error;
  }
});

const updateAddress = async () => {
  await update();
  await getAll();
  emit("setView", Views.default);
};
</script>
