<template>
  <UpmForm
    :model-value="model"
    @update:modelValue="(data: any) => updateModel(data)"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    :noActions="!showAddressFields"
    color="primary"
    :actions="actions"
  />
</template>

<script setup lang="ts">
// --- external
import { watch, computed } from "vue";

// --- internal
import {
  useClientAddress,
  useClientAddresses,
  useClientPhone,
} from "@upmind-automation/headless-vue";

// --- components
import { UpmForm, formRenderers } from "../../../../components/form";
import { Button } from "@upmind-automation/upmind-ui";
import { useBillingDetail } from "@upmind-automation/headless-vue";
import { useAddressFields } from "../../../../components/form/composables/useAddressFields";

// --- types
import type { Address } from "@upmind-automation/headless-vue";
import { Views } from "./types";
import type {
  ButtonProps,
  FormActionProps,
} from "@upmind-automation/upmind-ui";

// utils
import { debounce } from "lodash-es";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { update, set, model, schema, uischema, meta } = useBillingDetail();
const {
  update: updatePhone,
  set: setPhone,
  meta: phoneMeta,
} = useClientPhone();
const { isReady, getAll } = useClientAddresses();
const { showAddressFields, selectedAddress, setShowAddressFields } =
  useAddressFields();

await isReady().then(async () => {
  await getAll();
});

const actions = computed(() => ({
  submit: {
    label: "Save details",
    color: "secondary",
    loading: meta.value.isLoading,
    disabled: meta.value.isProcessing || !meta.value.isValid,
    type: "submit",
    size: "md",
    handler: updateAddress,
  } as FormActionProps,
}));

const updateModel = debounce(async (data: any) => {
  if (showAddressFields.value) {
    if (data?.address.phone) {
      await setPhone({ phone: data?.address.phone, type: 1 });
    }
    await set(data?.address);
  }
}, 500);

watch(selectedAddress, async address => {
  if (address) {
    await set(address);
    setShowAddressFields(true);
  }
});

const updateAddress = async () => {
  await update();
  await getAll();
  emit("setView", Views.default);
};
</script>
