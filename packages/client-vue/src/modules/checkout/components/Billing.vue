<template>
  <Loading :active="!model || meta.isLoading || meta.isProcessing">
    <UpmForm
      :model-value="model"
      class="min-h-40"
      :schema="schema"
      :uischema="uischema"
      :additional-renderers="formRenderers"
      color="primary"
      @update:modelValue="doInput"
      @resolve="doUpdate"
      :no-actions
    >
      <!-- <template #actions>
        <footer class="flex gap-x-6">
          <Button
            :loading="meta.isLoading"
            :disabled="!meta.isValid"
            type="submit"
            size="md"
            color="secondary"
            @click="doUpdate"
          >
            Save details
          </Button>
          <Link
            v-if="!isEmpty(model)"
            as="Button"
            size="sm"
            variant="muted"
            @click="cancel"
          >
            Cancel
          </Link>
        </footer>
      </template> -->
    </UpmForm>
  </Loading>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import { useBasketBilling } from "@upmind-automation/headless";

// --- components
import { UpmForm, formRenderers } from "../../../components/form";
import { Link, Button, Loading } from "@upmind-automation/upmind-ui";

// utils
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

const { isReady, update, input, model, schema, uischema, clear, meta } =
  useBasketBilling();

const noActions = computed(
  (): boolean =>
    !!model.value?.addressId || !!model.value?.companyId || meta.value.isLoading
);

await isReady();

function doInput(data: any) {
  input(data);
  // --or --
  update(data);
}

function doUpdate() {
  update({
    addressId: model.value?.addressId,
    companyId: model.value?.companyId,
    phoneId: model.value?.phoneId,
  });
}
</script>
