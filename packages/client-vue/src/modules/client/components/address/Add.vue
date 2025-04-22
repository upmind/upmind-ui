<template>
  <UpmForm
    :model-value="model"
    :schema="schema"
    :uischema="uischema"
    :additional-renderers="formRenderers"
    @update:modelValue="(data: any) => doUpdate(data)"
  >
    <template #actions>
      <footer class="flex gap-x-4">
        <Link
          label="Enter address manually"
          size="sm"
          variant="muted"
          class="leading-none"
        />

        <Link
          v-if="!isEmpty(data)"
          label="Use existing address"
          size="sm"
          variant="muted"
          class="leading-none"
          @click="emit('setView', Views.list)"
        />
      </footer>
    </template>
  </UpmForm>
</template>

<script setup lang="ts">
// --- internal
import {
  useClientAddress,
  useClientAddresses,
} from "@upmind-automation/headless-vue";

// --- components
import { UpmForm, formRenderers } from "../../../../components/form";
import { Link } from "@upmind-automation/upmind-ui";

// --- types
import type { AddressModel } from "@upmind-automation/headless-vue";
import { Views } from "./types";

// utils
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { update, set, model, schema, uischema } = useClientAddress();
const { isReady, getAll, data } = useClientAddresses();

await isReady().then(async () => {
  await getAll();
});

const doUpdate = async (data: AddressModel) => {
  await set(data);
  await update();
};
</script>
