<template>
  <Link
    :label="t('cart.change_amount')"
    color="muted"
    size="sm"
    @click="openForm"
    :dataAttrs="{ 'data-test-key': 'change-amount' }"
  />

  <FormModal
    v-model:open="open"
    v-model="model"
    modal
    no-actions
    :processing="processing"
    :schema="schema"
    :uischema="uischema"
    :title="t('cart.payment_amount')"
    :description="
      t('cart.payment_amount_msg', { amount: amountsFormatted?.amount })
    "
    :label="t('action.confirm_amount')"
    :cancel-label="cancelLabel"
    @resolve="doUpdate"
    @reject="doReject"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Link } from "@upmind-automation/upmind-ui";
import FormModal from "../../../components/form/FormModal.vue";
import type { PaymentAmountProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentAmountProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "reject"): void;
}>();

const { t } = useI18n();

const open = ref(false);

const model = ref({ amount: props.modelValue ?? props.amount ?? 0 });

const cancelLabel = computed(() => {
  // Show "Pay outstanding balance" only when a partial payment has been
  // confirmed AND the input still differs from the full amount
  if (
    props.modelValue !== props.amount &&
    model.value.amount !== props.amount
  ) {
    return t("cart.payment_amount_reset", {
      amount: props.amountsFormatted?.outstanding
    });
  }
});

function openForm() {
  model.value = { amount: props.modelValue ?? props.amount ?? 0 };
  open.value = true;
}

function doUpdate(data: Record<string, any>) {
  if (data?.amount !== undefined) {
    emit("update:modelValue", data.amount);
  }
}

function doReject() {
  emit("reject");
}
</script>
