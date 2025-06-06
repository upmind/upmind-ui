<template>
  <Loading :active="!model || isLoading">
    <UpmForm
      :model-value="model"
      class="min-h-40"
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
            :loading="billingMeta.isLoading"
            :disabled="!billingMeta.isValid"
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
    </UpmForm></Loading
  >
</template>

<script setup lang="ts">
// --- external
import { watch, ref, computed } from "vue";

// --- internal
import {
  useBillingDetails,
  useClientAddresses,
  useClientCompanies,
} from "@upmind-automation/headless-vue";

// --- components
import { UpmForm, formRenderers } from "../../../../components/form";
import { useBillingDetail } from "@upmind-automation/headless-vue";
import { useAddressFields } from "../../../../components/form/composables/useAddressFields";
import { Link, Button, Loading } from "@upmind-automation/upmind-ui";

// utils
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

const {
  update,
  input,
  model,
  schema,
  uischema,
  meta: billingMeta,
  clear,
} = useBillingDetail();
const { isReady, getAll, data, refresh } = useBillingDetails();
const { setDefault: setDefaultAddress } = useClientAddresses();
const { setDefault: setDefaultCompany } = useClientCompanies();
const { selectedAddress, setShowAddressFields } = useAddressFields();

const noActions = computed(() => {
  return (
    (model.value?.type === 1 && model.value?.addressId) ||
    (model.value?.type === 4 && model.value?.companyId) ||
    billingMeta.value.isLoading
  );
});

await isReady();
await getAll();

// Ensure we mark as loading straight away after input, otherwise there is a delay
const isLoading = ref(false);

const updateModel = async (data: any) => {
  await checkDefaults(data);
  await input(data);
};

watch(selectedAddress, async address => {
  if (address && model.value) {
    await input({
      ...model.value,
      address: address,
    });

    setShowAddressFields(true);
  }
});

const updateAddress = async () => {
  await update();
  await refresh();
  setShowAddressFields(false);
};

const checkDefaults = async (data: any) => {
  if (data?.addressId && model.value?.addressId !== data?.addressId) {
    isLoading.value = true;
    await setDefaultAddress(data?.addressId);
  } else if (data?.companyId && model.value?.companyId !== data?.companyId) {
    isLoading.value = true;
    await setDefaultCompany(data?.companyId);
  }
  isLoading.value = false;
};
const cancel = () => {
  clear();
  setShowAddressFields(false);
};
</script>
