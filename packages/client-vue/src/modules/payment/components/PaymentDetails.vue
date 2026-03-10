<template>
  <Section
    id="payment-details"
    value="payment-details"
    icon="wallet-02"
    :label="
      t('cart.payment_details', {
        amount: amountsFormatted?.amount
      })
    "
  >
    <template #actions>
      <PaymentAmount
        v-if="!meta.isFree && meta.canMakePartialPayment"
        :amount="amount"
        :amountsFormatted="amountsFormatted"
        :processing="meta.isProcessing"
        :modelValue="model?.amount"
        :currency="currency"
        :schema="schemaAmount"
        :uischema="uischemaAmount"
        @update:modelValue="setAmount"
        @reject="resetPartialAmount"
      />
    </template>

    <Loading :active="meta.isLoading" :class="styles.payment.root">
      <slot name="prepend" />

      <!-- Free -->
      <PaymentNotRequired
        v-if="meta.isAvailable && meta.isFree"
        :free="meta.isFree"
        :processing="meta.isProcessing"
        :hasErrors="meta.hasErrors"
        :payOffline="meta.isPayOffline"
        @resolve="doResolve"
      />

      <!-- Needs Payment -->
      <template v-if="meta.showPaymentSection">
        <!-- Account Credit -->
        <AccountCredit
          v-if="meta.hasAccountCredit"
          :processing="meta.isProcessing"
          :modelValue="model?.wallet_amount ?? 0"
          :amount="model?.amount ?? 0"
          :amounts-formatted="amountsFormatted"
          :accountCredit="accountCredit!"
          :currency="currency"
          :schema="schemaAmountCredit"
          :uischema="uischemaAmountCredit"
          @update:modelValue="setAmountCredit"
        />

        <!-- Stored Payments -->
        <StoredPaymentMethods
          v-if="meta.showStoredPaymentMethods"
          :errors="errors"
          :filtered="meta.hasUnsupportedPaymentMethods"
          :processing="meta.isProcessing"
          :schema="schemaStoredPaymentMethods"
          :uischema="uischemaStoredPaymentMethods"
          :modelValue="model?.payment_details_id"
          @update:modelValue="setStoredPaymentMethod"
        />

        <!-- Payment Error (shown when no gateway is active to display it) -->
        <Alert
          v-if="error && !meta.hasSelectedGateway"
          color="danger"
          variant="minimal"
          icon="alert-triangle"
          :title="t('text.payment_failed')"
          :description="error"
        />

        <!-- Selected Payment Gateway -->
        <PaymentGateway
          v-if="meta.hasSelectedGateway"
          :key="model!.gateway_id"
          :error="error"
          :single-gateway="meta.hasSingleGateway"
          @cancel="setGateway(null)"
        />

        <PayLater v-else-if="meta.isPayLater" @cancel="clear" />

        <PaymentActions
          v-if="meta.showPaymentActions"
          :disabled="!meta.isValid && !meta.isUnavailable"
          :offline="meta.isPayOffline"
          :processing="meta.isProcessing || processing"
          :clickwrap="clickwrap"
          :settlement="meta.isSettlement"
          @resolve="doResolve"
        />

        <!-- Payment Gateways selection -->
        <PaymentGateways
          v-if="meta.showGatewaySelection"
          :processing="meta.isProcessing"
          :modelValue="model?.gateway_id"
          :schema="schemaGateways"
          :uischema="uischemaGateways"
          @update:modelValue="setGateway"
        />

        <!-- No Gateways Available -->
        <PaymentGatewaysUnavailable
          v-if="meta.needsPayment && !meta.hasGateways"
          :clickwrap="clickwrap"
          :currencyCode="currency?.code"
          :countryName="address?.country?.name"
          :processing="meta.isProcessing"
          @resolve="doResolve"
        />

        <slot name="append" />
      </template>
    </Loading>
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { inject } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import config from "../payment.config";

// --- components
import { Alert, Loading, useStyles } from "@upmind-automation/upmind-ui";
import Section from "../../../components/section/Section.vue";
import AccountCredit from "./AccountCredit.vue";
import PaymentNotRequired from "./PaymentNotRequired.vue";
import PaymentAmount from "./PaymentAmount.vue";
import PaymentGateways from "./PaymentGateways.vue";
import PayLater from "./PayLater.vue";
import PaymentGateway from "./PaymentGateway.vue";
import PaymentGatewaysUnavailable from "./PaymentGatewaysUnavailable.vue";
import StoredPaymentMethods from "./StoredPaymentMethods.vue";
import PaymentActions from "./PaymentActions.vue";

// --- types
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  type UsePaymentDetails
} from "@upmind-automation/headless";
import type { PaymentDetailsProps } from "../types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<PaymentDetailsProps>(), {
  as: "div",
  class: "bg-surface"
});

const emit = defineEmits<{
  resolve: [];
}>();

const { t } = useI18n();

const styles = useStyles(["payment"], {}, config);

const paymentDetails = inject<UsePaymentDetails>("usePaymentDetails");

if (!paymentDetails)
  throw new DetailedError(
    t("error.payment_detail_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );

const {
  accountCredit,
  address,
  amount,
  amountsFormatted,
  clear,
  clickwrap,
  currency,
  errors,
  meta,
  model,
  resetPartialAmount,
  schemaAmount,
  schemaAmountCredit,
  schemaGateways,
  schemaStoredPaymentMethods,
  setAmount,
  setAmountCredit,
  setGateway,
  setStoredPaymentMethod,
  uischemaAmount,
  uischemaAmountCredit,
  uischemaGateways,
  uischemaStoredPaymentMethods
} = paymentDetails;

function doResolve() {
  emit("resolve");
}
</script>
