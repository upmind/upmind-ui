<template>
  <Link
    :label="t('cart.change_amount')"
    color="muted"
    size="sm"
    @click="openForm"
  />

  <FormModal
    v-model:open="open"
    modal
    no-actions
    :modelValue="model"
    :processing="props.processing"
    :schema="props.schema"
    :uischema="props.uischema"
    :title="t('cart.payment_amount')"
    :description="t('cart.payment_amount_msg', { amount: summary?.total })"
    :label="t('action.confirm_amount')"
    @resolve="doUpdate"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// --- components
import FormModal from "../../../components/form/FormModal.vue";
import { Link } from "@upmind-automation/upmind-ui";

// --- types
import type { PaymentAmountProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentAmountProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "resolve"): void;
}>();

const { t } = useI18n();
const { summary } = useBasket();
const open = ref(false);

const model = computed({
  get() {
    return { amount: props.modelValue ?? 0 };
  },
  set(value: { amount: number }) {
    if (value?.amount !== undefined) {
      emit("update:modelValue", value.amount);
    }
  }
});

function openForm() {
  open.value = true;
}

function doUpdate(data: Record<string, any>) {
  model.value = data as { amount: number };
}
</script>
