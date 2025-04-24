<template>
  <UpmForm
    :model-value="model"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    @update:modelValue="(data: any) => updateModel(data)"
    :noActions="!showAddressFields"
  />
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
import { Link } from "@upmind-automation/upmind-ui";
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

const { update, set, model, schema, uischema } = useClientAddress();
const { isReady, getAll, data } = useClientAddresses();
const { showAddressFields, selectedAddress, setShowAddressFields } =
  useAddressFields();

await isReady().then(async () => {
  await getAll();
});

const updateModel = debounce(async (address: Address) => {
  if (showAddressFields.value) {
    await set(address);
    await update();
  }
}, 500);

watch(selectedAddress, async address => {
  if (address) {
    try {
      await set(address);
      await update();
    } catch (error) {
      // Show the address input fields if the address lookup update fails
      setShowAddressFields(true);
    }
  }
});
</script>
