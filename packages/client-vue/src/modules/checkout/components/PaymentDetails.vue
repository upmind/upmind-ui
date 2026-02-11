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
        :processing="meta.isProcessing"
        :modelValue="model?.amount"
        :currency="currency"
        :schema="schemaAmount"
        :uischema="uischemaAmount"
        @update:modelValue="setAmount"
      />
    </template>

    <Loading
      :active="meta.isLoading"
      :class="styles.checkout.root"
      v-auto-animate
    >
      <!-- Free -->
      <PaymentNotRequired
        v-if="meta.isAvailable && meta.isFree"
        v-bind="props"
        @resolve="checkout"
      />

      <!-- Needs Payment -->
      <template v-if="meta.showPaymentSection">
        <!-- Account Credit -->
        <AccountCredit
          v-if="meta.hasAccountCredit"
          v-bind="props"
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
          v-bind="props"
          :errors="errors"
          :filtered="meta.hasUnsupportedPaymentMethods"
          :processing="meta.isProcessing"
          :schema="schemaStoredPaymentMethods"
          :uischema="uischemaStoredPaymentMethods"
          :modelValue="model?.payment_details_id"
          @update:modelValue="setStoredPaymentMethod"
        />

        <!-- Selected Payment Gateway -->
        <PaymentGateway
          v-if="meta.hasGateway"
          :key="model!.gateway_id"
          :single-gateway="meta.hasSingleGateway"
          @cancel="setGateway(null)"
        />

        <PayLater v-else-if="meta.isPayLater" @cancel="clear" />

        <PaymentActions
          v-if="meta.showPaymentActions"
          @resolve="checkout"
          :disabled="!meta.isValid && !meta.isUnavailable"
          :offline="meta.isPayOffline"
          :processing="meta.isProcessing"
          :clickwrap="clickwrap"
        />

        <!-- Payment Gateways selection -->
        <PaymentGateways
          v-if="meta.showGatewaySelection"
          v-bind="props"
          :processing="meta.isProcessing"
          :modelValue="model?.gateway_id"
          :schema="schemaGateways"
          :uischema="uischemaGateways"
          @update:modelValue="setGateway"
        />

        <!-- No Gateways Available -->
        <PaymentGatewaysUnavailable
          v-if="meta.needsPayment && !meta.hasGateways"
          @resolve="checkout"
        />
      </template>
    </Loading>
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useBasketPaymentDetails,
  useBasket
} from "@upmind-automation/headless";
import config from "../checkout.config";

// --- components
import { Loading, useStyles } from "@upmind-automation/upmind-ui";
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
import type { PaymentDetailsProps } from "../types";
import { useI18n } from "vue-i18n";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<PaymentDetailsProps>(), {
  as: "div",
  class: "bg-surface"
});

const { t } = useI18n();

const styles = useStyles(["checkout"], {}, config);

const {
  accountCredit,
  amountsFormatted,
  clickwrap,
  currency,
  errors,
  meta,
  model,
  schemaAmount,
  schemaAmountCredit,
  schemaGateways,
  schemaStoredPaymentMethods,
  uischemaAmount,
  uischemaAmountCredit,
  uischemaGateways,
  uischemaStoredPaymentMethods,
  // ---
  clear,
  setAmount,
  setAmountCredit,
  setGateway,
  setStoredPaymentMethod
} = useBasketPaymentDetails();

const { checkout } = useBasket();
</script>
