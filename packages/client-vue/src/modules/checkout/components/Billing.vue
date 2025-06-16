<template>
  <Loading :active="!model || meta.isLoading || meta.isProcessing">
    <UpmForm
      :model-value="model"
      class="min-h-40"
      :schema="schema"
      :uischema="uischema"
      :additional-renderers="formRenderers"
      color="primary"
      @update:modelValue="input"
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

await isReady();
</script>
