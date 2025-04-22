<template>
  <UpmForm
    :model-value="model"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    @update:modelValue="(data: any) => doUpdate(data)"
  >
    <template #actions>
      <Link
        label="Enter address manually"
        size="sm"
        variant="muted"
        class="-mt-4 leading-none"
      />
    </template>
  </UpmForm>
</template>

<script setup lang="ts">
// --- internal
import { useClientAddress } from "@upmind-automation/headless-vue";

import { UpmForm, formRenderers } from "../../../../components/form";
import { Link } from "@upmind-automation/upmind-ui";

// --- types
import type { AddressModel } from "@upmind-automation/headless-vue";

const { update, set, model, schema, uischema } = useClientAddress();

const doUpdate = async (data: AddressModel) => {
  await set(data);
  await update();
};
</script>
