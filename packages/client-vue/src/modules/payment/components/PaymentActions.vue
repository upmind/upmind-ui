<template>
  <footer key="actions" :class="footerRootVariants()">
    <div :class="footerActionsVariants()">
      <Button
        class="self-center"
        :disabled="meta.isDisabled"
        :loading="meta.isProcessing"
        size="lg"
        block
        :data-attrs="{ 'data-test-key': 'button-complete-checkout' }"
        @click.prevent="onResolve"
      >
        {{ action }}
        <Icon icon="arrow-right" />
      </Button>
    </div>

    <Markdown
      v-if="clickwrap"
      tag="p"
      :class="clickwrapVariants()"
      :model-value="clickwrap"
      :keys="{ action }"
    />

    <TermsAndConditions v-else :class="footerTermsVariants()" :label="action" />
  </footer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Button, Markdown } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import {
  footerRootVariants,
  footerActionsVariants,
  footerTermsVariants,
  clickwrapVariants
} from "../variants";
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

function onResolve() {
  emit("resolve");
}
</script>
