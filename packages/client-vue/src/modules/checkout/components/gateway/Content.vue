<template>
  <PaymentGateway
    v-if="!!gatewayId"
    v-show="meta.hasGateway && gatewayId == modelValue"
    :id="gatewayId"
    :class="styles.checkout.gateway"
    class="w-full"
  />

  <footer :class="styles.checkout.footer" v-auto-animate>
    <Button
      :disabled="!basketMeta.isReadyForCheckout || meta.isProcessing"
      :loading="basketMeta.isProcessingDetails"
      :color="color"
      @click.prevent="handleCheckout"
      :label="getGatewayi18n('actions.submit')"
      :class="styles.checkout.action"
    />

    <div
      v-if="!getGatewayi18n('footer.title').includes('checkout')"
      :class="styles.checkout.additional"
    >
      <Icon :icon="getGatewayi18n('footer.icon')" class="size-3" />
      <span>
        {{ getGatewayi18n("footer.title") }}
      </span>
    </div>
  </footer>

  <Clickwrap :action-text="getGatewayi18n('actions.submit')" />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import config from "../../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Icon, Button } from "@upmind-automation/upmind-ui";
import PaymentGateway from "../PaymentGateway.vue";
import Clickwrap from "./Clickwrap.vue";

// --- types
import type { ComputedRef } from "vue";
import type { GatewayContentProps } from "./types";

// --- props
const props = defineProps<GatewayContentProps>();

const { t, te } = useI18n();

const emit = defineEmits(["checkout"]);

const styles = useStyles(["checkout"], {}, config) as ComputedRef<{
  checkout: {
    gateway: string;
    content: string;
    footer: string;
    action: string;
    additional: string;
    terms: string;
  };
}>;

// TODO: Import gateway type from machine (we don't have it yet)
const getGatewayi18n = (property: string) => {
  const type = props.item.gateway.type;
  const code = props.item.gateway.gateway_provider?.code;
  if (type === 1) {
    const codeKey = `checkout.${code}.${property}`;
    if (te(codeKey)) return t(codeKey);
    return t(`checkout.${type}.${property}`);
  }

  return t(`checkout.${type}.${property}`);
};

const handleCheckout = () => {
  emit("checkout");
};
</script>
