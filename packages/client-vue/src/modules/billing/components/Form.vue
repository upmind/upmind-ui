<template>
  <pre>{{ { type, model } }}</pre>
  <component
    v-if="modal || (!modal && meta.isOpen)"
    :is="modal ? Dialog : 'section'"
    v-model:open="open"
    size="3xl"
    :title="t('billing.form.title', { type, isNew: !id })"
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
          :disabled="meta.isProcessing || !meta.isTouched"
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
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import {
  UnifiedAddressType,
  useClientAddress,
  useClientCompany,
  useUnifiedAddress,
  utils,
  type AddressModel,
  type BillingModel,
  type CompanyModel,
  type PhoneModel,
} from "@upmind-automation/headless";

// --- components
import { UpmForm } from "../../../components/form";
import { Dialog } from "@upmind-automation/upmind-ui";
import Skeleton from "./Skeleton.vue";
import Actions from "./Actions.vue";

// --- utils
const { DEBOUNCE_DELAY } = utils;

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
  clientId: string;
  type: UnifiedAddressType;
  id?: string;
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
const open = useVModel(props, "open", emits);
const loading = ref(true);
const processing = ref(false);
const touched = ref(false);

const { model, isReady, update, clear, input, schema, uischema } =
  useUnifiedAddress(props.clientId, props.type);

const meta = computed(() => ({
  isProcessing: processing.value,
  isLoading: loading.value,
  isTouched: touched.value,
  isOpen: props.open,
}));

onMounted(async () => {
  const startTime = Date.now();
  await isReady();

  // Ensure skeleton shows for at least 1 second
  const elapsedTime = Date.now() - startTime;
  const remainingTime = Math.max(0, 1000 - elapsedTime);

  if (remainingTime > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingTime));
  }

  loading.value = false;
});

const doResolve = async () => {
  processing.value = true;
  update()
    .then(value => {
      emits("resolve", {
        addressId: value.address?.id,
        companyId: value.company?.id,
        phoneId: value.phone?.id,
      });
      touched.value = false;
      doReject();
    })
    .catch(() => {
      processing.value = false;
    });
};

const doInput = (value: any) => {
  touched.value = true;
  input(value);
};

const doReject = () => {
  open.value = false;
  setTimeout(() => {
    clear();
    processing.value = false;
  }, DEBOUNCE_DELAY);
};
</script>
