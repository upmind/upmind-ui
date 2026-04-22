<template>
  <div ref="form">
    <CheckboxCards
      v-model="checked"
      :items="[
        {
          id: 'account-credit',
          value: 'account-credit',
          'data-testid': 'account-credit',
          label: t('cart.account_credit_use', {
            amount: safeAmountFormatted
          }),
          secondaryDescription: t('cart.account_credit_use_msg', {
            ownedAmount: props.accountCredit.owned.amount,
            creditAmount: props.accountCredit.credit.amount,
            n: +!!props.accountCredit.credit.value
          }),
          action: {
            label: t('text.adjust'),
            handler: openForm,
            disabled: props.processing,
            visible: !!props.modelValue
          }
        }
      ]"
    />

    <FormModal
      v-model:open="open"
      modal
      no-actions
      :modelValue="model"
      :processing="processing"
      :schema="schema"
      :uischema="uischema"
      :title="t('cart.account_credit')"
      :description="
        t('cart.account_credit_msg', {
          ownedAmount: props.accountCredit.owned.amount,
          creditAmount: props.accountCredit.credit.amount,
          n: +!!props.accountCredit.credit.value
        })
      "
      :label="t('action.confirm_amount')"
      @resolve="doUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import FormModal from "../../../components/form/FormModal.vue";
import { CheckboxCards } from "@upmind-automation/upmind-ui";

// --- types
import type { AccountCreditProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<AccountCreditProps>();

const open = ref(false);

const model = defineModel("modelValue", {
  get() {
    return {
      wallet_amount: checked.value ? (props.modelValue ?? props.amount) : 0
    };
  },
  set(value: { wallet_amount: number }) {
    return value.wallet_amount;
  }
});

const checked = computed({
  get: () => (!!props.modelValue ? ["account-credit"] : []),
  set: (value: string[]) => {
    model.value = {
      wallet_amount: value.includes("account-credit")
        ? Math.min(props.amount, props.accountCredit.total.value)
        : 0
    };
  }
});

const { t } = useI18n();

const safeAmountFormatted = computed(() => {
  // If wallet amount is selected and we have a formatted value for it, use it
  if (props.modelValue && props.amountsFormatted?.wallet) {
    return props.amountsFormatted?.wallet;
  }

  // Otherwise, determine which value would be used and return the corresponding formatted string
  const value =
    props.modelValue || Math.min(props.amount, props.accountCredit.total.value);

  if (value === props.amount) {
    return props.amountsFormatted?.amount;
  } else {
    return props.accountCredit.total.amount;
  }
});

function openForm() {
  open.value = true;
}

function doUpdate(data: Record<string, any>) {
  model.value = data as { wallet_amount: number };
}
</script>
