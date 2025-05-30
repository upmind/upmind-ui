<template>
  <pre>{{ model }}</pre>
  <UpmForm
    :model-value="model"
    @update:modelValue="(data: any) => updateModel(data)"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    color="primary"
    @resolve="updateAddress"
    :no-actions="noActions"
  >
    <template #actions>
      <footer class="flex gap-x-6">
        <Button
          :loading="meta.isLoading"
          :disabled="!meta.isValid"
          type="submit"
          size="md"
          color="secondary"
          @click="updateAddress"
        >
          Save details
        </Button>
        <Link
          v-if="!isEmpty(data)"
          as="Button"
          size="sm"
          variant="muted"
          @click="cancel"
        >
          Cancel
        </Link>
      </footer>
    </template>
  </UpmForm>
</template>

<script setup lang="ts">
// --- external
import { watch, ref } from "vue";

// --- internal
import { useBillingDetails } from "@upmind-automation/headless-vue";

// --- components
import { UpmForm, formRenderers } from "../../../../components/form";
import { useBillingDetail } from "@upmind-automation/headless-vue";
import { useAddressFields } from "../../../../components/form/composables/useAddressFields";
import { Link, Button } from "@upmind-automation/upmind-ui";

// --- types
import { Views } from "./types";

// utils
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  view: Views;
}>();

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { update, input, model, schema, uischema, meta, clear } =
  useBillingDetail();
const { isReady, getAll, data } = useBillingDetails();
const { showAddressFields, selectedAddress, setShowAddressFields } =
  useAddressFields();

const noActions = ref(model.value?.addressId !== null);

await isReady();
await getAll();

const updateModel = async (data: any) => {
  // await input(data);
  if (noActions.value) {
    noActions.value = false;
  }
};

watch(selectedAddress, async address => {
  if (address && model.value) {
    await input({
      ...model.value,
      address: address,
    });
    if (noActions.value) {
      noActions.value = false;
    }
    setShowAddressFields(true);
  }
});

watch(
  () => props.view,
  newView => {
    if (newView === Views.add) {
      clear();
      noActions.value = false;
    }
  }
);

const updateAddress = async () => {
  await update();
  await getAll();
  emit("setView", Views.default);
  setShowAddressFields(false);
};

const cancel = () => {
  emit("setView", Views.default);
  setShowAddressFields(false);
  noActions.value = false;
};
</script>
