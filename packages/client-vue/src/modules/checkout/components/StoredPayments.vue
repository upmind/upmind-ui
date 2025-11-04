<template>
  <Loading :active="!meta.isAvailable">
    <div ref="form" :class="styles.checkout.gateway">
      <Alert
        v-if="meta.hasUnsupportedPaymentMethods"
        icon="info-circle"
        variant="minimal"
        :title="t('cart.stored_payment_methods_limited_title')"
        :description="t('cart.stored_payment_methods_limited_desc')"
      />

      <Form
        key="form"
        :additional-errors="validationErrors"
        :model-value="model"
        :processing="meta.isProcessing"
        :schema="schema"
        :uischema="uischema"
        @reject="clear"
        @resolve="useStoredPayment"
        no-actions
      />

      <!-- Errors and Feedback -->

      <Alert
        v-if="meta.hasErrors"
        color="warning"
        icon="alert-triangle"
        :title="t('text.payment_failed')"
      >
        <div class="mt-2 text-sm">
          <li class="my-0 py-0">
            {{ errors }}
          </li>
        </div>
      </Alert>

      <!-- Actions and Terms -->
      <footer key="actions" :class="styles.checkout.footer.root">
        <div :class="styles.checkout.footer.actions">
          <Button
            :disabled="meta.isProcessing"
            :loading="meta.isProcessing"
            :color="props.color"
            size="lg"
            @click.prevent="handleCheckout"
            :label="action"
            :class="styles.checkout.action"
          />

          <p v-if="!meta.isFree" :class="styles.checkout.additional">
            <Icon icon="lock" size="nano" />
            {{ t("cart.encrypted_and_secure_payments") }}
          </p>
        </div>

        <Markdown
          v-if="clickwrap"
          tag="p"
          :class="styles.checkout.clickwrap"
          :model-value="clickwrap"
          :keys="{ action }"
        />

        <TermsAndConditions
          v-else
          :class="styles.checkout.footer.terms"
          :label="action"
        />
      </footer>
    </div>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { type ComputedRef, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentDetails } from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles, Loading } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";

// --- components
import { Alert, Markdown, Button, Icon } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- utils

// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();
const emit = defineEmits(["checkout"]);

const {
  meta,
  errors,
  validationErrors,
  model,
  schema,
  uischema,
  clear,
  useStoredPayment,
  clickwrap
} = useBasketPaymentDetails();

const { t } = useI18n();

const styles = useStyles(
  ["checkout", "checkout.footer"],
  meta,
  config
) as ComputedRef<{
  checkout: {
    gateway: string;
    content: string;
    footer: {
      root: string;
      actions: string;
      terms: string;
    };
    action: string;
    additional: string;
    terms: string;
    clickwrap: string;
  };
}>;

const action = computed(() => {
  if (meta.value.isFree) return t("action.place_order");

  // if (meta.value.payLater) return t("action.place_order_pay_later");

  return t("action.place_order_and_pay");
});

const handleCheckout = () => {
  emit("checkout");
};

// --- side effects
</script>
