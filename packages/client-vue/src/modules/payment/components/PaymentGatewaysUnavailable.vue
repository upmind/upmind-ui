<template>
  <div :class="styles.payment.gateway">
    <Alert
      variant="minimal"
      color="warning"
      icon="alert-triangle"
      :title="
        t('error.payment_gateways_not_available_title', {
          currency: currencyCode,
          country: countryName
        })
      "
      :description="t('error.payment_gateways_not_available_msg')"
    />

    <!-- Actions and Terms -->
    <footer key="actions" :class="styles.payment.footer.root">
      <div :class="styles.payment.footer.actions">
        <Button
          :disabled="processing"
          :loading="processing"
          size="lg"
          @click.prevent="handleCheckout"
          :label="t('action.place_order')"
          :class="styles.payment.action"
        />
      </div>

      <Markdown
        v-if="clickwrap"
        tag="p"
        :class="styles.payment.clickwrap"
        :model-value="clickwrap"
        :keys="{ action: t('action.place_order') }"
      />

      <TermsAndConditions
        v-else
        :class="styles.payment.footer.terms"
        :label="t('action.place_order')"
      />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Alert, Markdown, Button } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import config from "../payment.config";
import type { PaymentGatewaysUnavailableProps } from "../types";

// -----------------------------------------------------------------------------
const _props = defineProps<PaymentGatewaysUnavailableProps>();
const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const { t } = useI18n();

const styles = useStyles(["payment", "payment.footer"], {}, config);

const handleCheckout = () => {
  emit("resolve");
};
</script>
