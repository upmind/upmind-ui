<template>
  <UpmForm
    :model-value="model"
    @update:modelValue="(data: any) => updateModel(data)"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    :no-actions="!showAddressFields"
    color="primary"
    @resolve="updateAddress"
  >
    <template v-if="showAddressFields" #actions>
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
        <Link as="Button" size="sm" variant="muted" @click="cancel">
          Cancel
        </Link>
      </footer>
    </template>
  </UpmForm>
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
import { Link, Button } from "@upmind-automation/upmind-ui";

// --- types
import { Views } from "./types";
import type { FormActionProps } from "@upmind-automation/upmind-ui";

// utils
import { debounce, isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { update, set, model, schema, uischema, meta } = useBillingDetail();
const { isReady, getAll, data } = useBillingDetails();
const { showAddressFields, selectedAddress, setShowAddressFields } =
  useAddressFields();

await isReady().then(async () => {
  await getAll();
});

const updateModel = debounce(async (data: any) => {
  await set(data);
}, 500);

watch(selectedAddress, async address => {
  if (address) {
    const updatedModel = {
      details: { address, company: model.value.details.company },
    };
    await set(updatedModel);
    setShowAddressFields(true);
  }
});

const updateAddress = async () => {
  await update();
  await getAll();
  emit("setView", Views.default);
  setShowAddressFields(false);
};

const cancel = () => {
  emit("setView", Views.default);
  setShowAddressFields(false);
};
</script>
