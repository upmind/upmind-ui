<template>
  <div :class="styles.checkout.gateway.root">
    <RadioCards
      model-value="pay-later"
      required
      :items="[
        {
          id: 'selected-gateway',
          value: 'pay-later',
          index: 0,
          modelValue: 'pay-later',
          label: t('form.payment_method_type.pay-later'),
          action: {
            label: t('action.change'),
            handler: clearGateway
          }
        }
      ]"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import {
  onMounted,
  useTemplateRef,
  type ComputedRef,
  computed,
  ref
} from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentGateway } from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles, Loading } from "@upmind-automation/upmind-ui";

// --- components
import {
  Alert,
  Markdown,
  Button,
  RadioCards
} from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const emit = defineEmits(["resolve", "reject", "cancel"]);

const { t } = useI18n();

const styles = useStyles(
  ["checkout", "checkout.footer", "checkout.gateway"],
  {},
  config
);

const clearGateway = () => {
  emit("cancel");
};
// --- side effects
</script>
