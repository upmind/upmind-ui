<template>
  <footer key="actions" :class="styles.checkout.footer.root">
    <div :class="styles.checkout.footer.actions">
      <Button
        :disabled="meta.isDisabled"
        :loading="meta.isProcessing"
        size="lg"
        @click.prevent="onResolve"
        :label="action"
        :class="styles.checkout.action"
        blockf
      />
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
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- internal
import config from "../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Button, Markdown } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";

// --- types
import type { ComputedRef } from "vue";
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
  isFree: props.free
}));

const action = computed(() => {
  if (meta.value.isPayOffline || meta.value.isFree)
    return t("action.place_order");
  return t("action.place_order_and_pay");
});
const styles = useStyles(
  ["checkout", "checkout.stored", "checkout.footer"],
  meta,
  config
) as ComputedRef<{
  checkout: {
    footer: {
      root: string;
      actions: string;
      terms: string;
    };
    action: string;
    clickwrap: string;
  };
}>;

function onResolve() {
  emit("resolve");
}
</script>
