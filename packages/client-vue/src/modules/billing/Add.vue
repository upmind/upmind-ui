<template>
  <component
    v-if="modal || (!modal && open)"
    :is="modal ? Dialog : 'section'"
    v-model:open="open"
    size="3xl"
    :title="t('billing.form.title', { type, isNew: true })"
  >
    <Skeleton v-if="meta.isLoading" />

    <UpmForm
      v-else
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      color="secondary"
      @update:modelValue="doInput"
      @resolve="doResolve"
      @reject="doReject"
      :processing="meta.isProcessing"
    >
      <template #actions="{ doReject, doResolve }">
        <Actions
          :type="type === UnifiedAddressType.PERSONAL ? 'address' : 'company'"
          :disabled="meta.isProcessing || !meta.isValid"
          :processing="meta.isProcessing"
          :loading="meta.isLoading"
          @save="doResolve"
          @cancel="doReject"
        />
      </template>
    </UpmForm>
  </component>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import {
  UnifiedAddressType,
  useUnifiedAddress,
  type BillingModel,
} from "@upmind-automation/headless";

// --- components
import { Dialog } from "@upmind-automation/upmind-ui";
import { UpmForm } from "../../components/form";
import Skeleton from "./components/Skeleton.vue";
import Actions from "./components/Actions.vue";

// --- utils

// --- types

// ------------------------./components/Actions.vue---------------------

const props = defineProps<{
  modelValue?: BillingModel;
  type: UnifiedAddressType;
  readonly?: boolean;
  open?: boolean;
  modal?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "resolve", value: BillingModel): void;
  (e: "reject"): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

// --- state

const { meta, model, isReady, update, clear, input, schema, uischema, stop } =
  useUnifiedAddress(props.modelValue ?? {}, props.type);

await isReady();

const open = useVModel(props, "open", emits, {
  passive: true,
});

const doResolve = async () => {
  update().then(value => {
    emits("resolve", {
      addressId: value.address?.id,
      companyId: value.company?.id,
      phoneId: value.phone?.id,
    });
    doClose();
  });
};

const doInput = (value: any) => {
  input(value);
};

const doReject = () => {
  clear();
  emits("reject");
  doClose();
};

const doClose = () => {
  stop();
  open.value = false;
};
</script>
