<template>
  <div ref="form">
    <OptionTileGroup v-model="checked" mode="multiple">
      <OptionTile
        value="account-credit"
        data-test-key="account-credit"
        :label="t('cart.account_credit_use', { amount: safeAmountFormatted })"
        :description="
          t('cart.account_credit_use_msg', {
            ownedAmount: props.accountCredit.owned.amount,
            creditAmount: props.accountCredit.credit.amount,
            n: +!!props.accountCredit.credit.value
          })
        "
      >
        <template v-if="!!props.modelValue" #trailing>
          <Link
            size="sm"
            color="muted"
            :disabled="props.processing"
            @click="openForm"
          >
            {{ t("text.adjust") }}
          </Link>
        </template>
      </OptionTile>
    </OptionTileGroup>

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
import { OptionTileGroup, OptionTile, Link } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import FormModal from "../../../components/form/FormModal.vue";
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
  get: () => (props.modelValue ? ["account-credit"] : []),
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
