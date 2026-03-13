<template>
  <div :class="styles.payment.gateway.root">
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
import { useI18n } from "vue-i18n";

// --- internal
import config from "../payment.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { RadioCards } from "@upmind-automation/upmind-ui";

// --- types

// -----------------------------------------------------------------------------
const emit = defineEmits(["resolve", "reject", "cancel"]);

const { t } = useI18n();

const styles = useStyles(
  ["payment", "payment.footer", "payment.gateway"],
  {},
  config
);

const clearGateway = () => {
  emit("cancel");
};
// --- side effects
</script>
