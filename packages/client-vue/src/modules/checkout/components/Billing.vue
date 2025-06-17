<template>
  <Loading :active="showLoading || meta.isLoading" skrim="full">
    <UpmForm
      :model-value="model"
      class="min-h-40"
      :schema="schema"
      :uischema="uischema"
      :additional-renderers="formRenderers"
      color="primary"
      @update:modelValue="onInput"
      no-actions
    />
  </Loading>
</template>

<script setup lang="ts">
// --- external
import { ref, onMounted } from "vue";

// --- internal
import {
  useBasketBilling,
  useUnifiedAddress,
} from "@upmind-automation/headless";

// --- components
import { UpmForm, formRenderers } from "../../../components/form";
import { Loading } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const { isReady, input, model, schema, uischema, meta } = useBasketBilling();

const showLoading = ref(true);
onMounted(() => {
  setTimeout(() => {
    showLoading.value = false;
  }, 1000);
});

const onInput = (value: any) => {
  // TODO: The oneOfRenderer should handle this, was a pain but come back to this
  const updatedValue = { ...value };
  if (model.value?.addressId && updatedValue.companyId) {
    updatedValue.addressId = null;
  } else if (model.value?.companyId && updatedValue.addressId) {
    updatedValue.companyId = null;
  }
  input(updatedValue);
};

await isReady();
</script>
