<template>
  <UpmForm
    :model-value="model"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    @update:modelValue="data => input(data as AddressModel)"
    @resolve="doUpdate"
    @reject="doCancel"
  />
</template>

<script setup lang="ts">
// --- internal
import {
  useClientAddresses,
  useClientAddress,
  type AddressModel,
} from "@upmind-automation/headless-vue";

import { UpmForm, formRenderers } from "../../../../components/form";

const { isReady } = useClientAddresses();

const { update, input, model, meta, schema, uischema, stop } =
  useClientAddress();

function doUpdate() {}

function doCancel() {}
</script>
