<template>
  <Loading :active="!model || meta.isLoading || meta.isProcessing">
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
// --- internal
import { useBasketBilling } from "@upmind-automation/headless";

// --- components
import { UpmForm, formRenderers } from "../../../components/form";
import { Button, Loading } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { isReady, input, model, schema, uischema, meta } = useBasketBilling();

const onInput = (value: any) => {
  // TODO: The oneOfRenderer should handle this, was a pain but come back to this
  if (model.value?.addressId && value?.companyId) {
    value.addressId = null;
  } else if (value?.companyId && !model.value?.addressId) {
    value.companyId = null;
  }
  input(value);
};

await isReady();
</script>
