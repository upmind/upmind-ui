<template>
  <PaymentGateway
    v-if="!!gatewayId"
    v-show="meta.hasGateway && gatewayId == modelValue"
    :id="gatewayId"
    :class="styles.checkout.gateway"
    class="w-full"
  />

  <footer :class="styles.checkout.footer.root" v-auto-animate>
    <div :class="styles.checkout.footer.actions">
      <Button
        :disabled="!basketMeta.isReadyForCheckout || meta.isProcessing"
        :loading="basketMeta.isProcessingDetails"
        :color="color"
        size="lg"
        @click.prevent="handleCheckout"
        :label="t(getGatewayi18n('actions.submit'))"
        :class="styles.checkout.action"
        pill
      />

      <p
        v-if="!t(getGatewayi18n('footer.title')).includes('checkout')"
        :class="styles.checkout.additional"
      >
        <Icon :icon="t(getGatewayi18n('footer.icon'))" size="nano" />
        {{ t(getGatewayi18n("footer.title")) }}
      </p>
    </div>

    <Markdown
      v-if="uiCart?.clickwrap_disclaimer"
      tag="p"
      :class="styles.checkout.clickwrap"
      :model-value="uiCart.clickwrap_disclaimer"
      :keys="{ action: t(getGatewayi18n('actions.submit')) }"
    />

    <TermsAndConditions
      v-else
      :class="styles.checkout.footer.terms"
      :label="getGatewayi18n('actions.submit')"
    />
  </footer>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import config from "../../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";
import { useBrand } from "@upmind-automation/headless";

// --- components
import TermsAndConditions from "../../../brand/TermsAndConditions.vue";
import { Icon, Button, Markdown } from "@upmind-automation/upmind-ui";
import PaymentGateway from "../PaymentGateway.vue";
// --- types
import type { ComputedRef } from "vue";
import type { GatewayContentProps } from "./types";

// --- props
const props = defineProps<GatewayContentProps>();

const { t, te } = useI18n();

const { uiCart } = useBrand();

const emit = defineEmits(["checkout"]);

const styles = useStyles(
  ["checkout", "checkout.footer"],
  {},
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

// TODO: Import gateway type from machine (we don't have it yet)
const getGatewayi18n = (property: string) => {
  const type = props.item.gateway.type;
  const code = props.item.gateway.gateway_provider?.code;
  if (type === 1) {
    return t(`cart.gateway.${code}.${property}`);
  }

  return `cart.gateway.${type}.${property}`;
};

const handleCheckout = () => {
  emit("checkout");
};
</script>
