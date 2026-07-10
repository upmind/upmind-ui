<template>
  <footer key="actions" :class="styles.payment.footer.root">
    <div :class="styles.payment.footer.actions">
      <Button
        :class="styles.payment.action"
        :label="action"
        :disabled="meta.isDisabled"
        :loading="meta.isProcessing"
        icon-append="arrow-right"
        size="lg"
        block
        :data-attrs="{ 'data-test-key': 'button-complete-checkout' }"
        @click.prevent="onResolve"
      />
    </div>

    <Markdown
      v-if="clickwrap"
      tag="p"
      :class="styles.payment.clickwrap"
      :model-value="clickwrap"
      :keys="{ action }"
    />

    <TermsAndConditions
      v-else
      :class="styles.payment.footer.terms"
      :label="action"
    />
  </footer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Button, Markdown } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import config from "../payment.config";
import type { PaymentActionsProps } from "../types";

const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const { t } = useI18n();

const props = defineProps<PaymentActionsProps>();

const meta = computed(() => ({
  hasErrors: props.errors,
  isProcessing: props.processing,
  isDisabled: props.disabled,
  isPayOffline: props.offline,
  isFree: props.free,
  isSettlement: props.settlement
}));

const action = computed(() => {
  if (meta.value.isSettlement) return t("action.pay_now");
  if (meta.value.isPayOffline || meta.value.isFree)
    return t("action.place_order");
  return t("action.place_order_and_pay");
});
const styles = useStyles(
  ["payment", "payment.stored", "payment.footer"],
  meta,
  config
);

function onResolve() {
  emit("resolve");
}
</script>
