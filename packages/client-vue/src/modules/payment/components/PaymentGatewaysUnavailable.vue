<template>
  <!-- NB: parity with the retired useStyles output — `styles.payment.gateway`
       resolved to the no-op literal "root form" (the gateway cva object was
       never path-requested here), so no gateway styling is applied. -->
  <div class="root form">
    <Alert
      appearance="outline"
      variant="warning"
      :title="
        t('error.payment_gateways_not_available_title', {
          currency: currencyCode,
          country: countryName
        })
      "
      :description="t('error.payment_gateways_not_available_msg')"
    >
      <template #icon><Icon icon="alert-triangle" /></template>
    </Alert>

    <!-- Actions and Terms -->
    <footer key="actions" :class="footerRootVariants()">
      <div :class="footerActionsVariants()">
        <Button
          :loading="processing"
          size="lg"
          @click.prevent="handleCheckout"
          :class="actionVariants()"
        >
          {{ t("action.place_order") }}
        </Button>
      </div>

      <Markdown
        v-if="clickwrap"
        tag="p"
        :class="clickwrapVariants()"
        :model-value="clickwrap"
        :keys="{ action: t('action.place_order') }"
      />

      <TermsAndConditions
        v-else
        :class="footerTermsVariants()"
        :label="t('action.place_order')"
      />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Button, Markdown } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import {
  footerRootVariants,
  footerActionsVariants,
  footerTermsVariants,
  actionVariants,
  clickwrapVariants
} from "../variants";
import type { PaymentGatewaysUnavailableProps } from "../types";

// -----------------------------------------------------------------------------
defineProps<PaymentGatewaysUnavailableProps>();
const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const { t } = useI18n();

const handleCheckout = () => {
  emit("resolve");
};
</script>
