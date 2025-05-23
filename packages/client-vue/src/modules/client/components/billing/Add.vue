<template>
  <UpmForm
    :model-value="mappedModel"
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
import { useBillingDetails } from "@upmind-automation/headless-vue";

// --- components
import { UpmForm, formRenderers } from "../../../../components/form";
import { useBillingDetail } from "@upmind-automation/headless-vue";
import { useAddressFields } from "../../../../components/form/composables/useAddressFields";

// --- types
import { Views } from "./types";
import type { FormActionProps } from "@upmind-automation/upmind-ui";
import type { UnifiedAddressModel } from "@upmind-automation/headless-vue";

// utils
import { isEmpty, pick, debounce, some } from "lodash-es";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { update, set, model, schema, uischema, meta } = useBillingDetail();
const { isReady, getAll } = useBillingDetails();
const { showAddressFields, selectedAddress, setShowAddressFields } =
  useAddressFields();

await isReady().then(async () => {
  await getAll();
});

const mappedModel = computed(() => {
  const company = some(
    pick(model.value, ["companyName", "regNumber", "vatNumber"]),
    value => !isEmpty(value)
  );

  return company
    ? {
        details: {
          company: model.value,
        },
      }
    : {
        details: {
          address: model.value,
        },
      };
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

const updateModel = debounce(async data => {
  await set(parseData(data));
}, 500);

watch(selectedAddress, async (data: any) => {
  if (data) {
    await set(parseData(data));
    setShowAddressFields(true);
  }
});

const parseData = (data: any) => {
  const company = some(
    pick(data, ["companyName", "regNumber", "vatNumber"]),
    value => !isEmpty(value)
  );

  return company ? data.company : data.address;
};

const updateAddress = async () => {
  await update();
  await getAll();
  emit("setView", Views.default);
};
</script>
