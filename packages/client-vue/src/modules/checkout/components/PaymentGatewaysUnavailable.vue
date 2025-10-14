<template>
  <div :class="styles.checkout.gateway">
    <Alert
      color="warning"
      icon="alert-triangle"
      :title="
        t('error.payment_gateways_not_available_title', {
          currency: currency?.code,
          country: address?.country?.name
        })
      "
      :description="t('error.payment_gateways_not_available_msg')"
    />

    <!-- Actions and Terms -->
    <footer key="actions" :class="styles.checkout.footer.root">
      <div :class="styles.checkout.footer.actions">
        <Button
          :disabled="meta.isProcessing"
          :loading="meta.isProcessing"
          :color="props.color"
          size="lg"
          @click.prevent="handleCheckout"
          :label="t('action.place_order')"
          :class="styles.checkout.action"
          pill
        />
      </div>

      <Markdown
        v-if="clickwrap"
        tag="p"
        :class="styles.checkout.clickwrap"
        :model-value="clickwrap"
        :keys="{ action: t('action.place_order') }"
      />

      <TermsAndConditions
        v-else
        :class="styles.checkout.footer.terms"
        :label="t('action.place_order')"
      />
    </footer>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentDetails } from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles, Loading } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";

// --- components
import { Alert, Markdown, Button } from "@upmind-automation/upmind-ui";

// --- utils

// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();
const emit = defineEmits(["checkout"]);

const { meta, clickwrap, currency, address } = useBasketPaymentDetails();

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

const handleCheckout = () => {
  emit("checkout");
};

// --- side effects
</script>
