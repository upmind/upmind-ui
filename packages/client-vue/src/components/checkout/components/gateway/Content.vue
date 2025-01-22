<template>
  <PaymentGateway
    v-show="meta.hasGateway && gateway.id == model.gateway_id"
    :id="gateway.id"
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
      v-if="!getGatewayi18n('footer.title').includes('basket')"
      :class="styles.checkout.additional"
    >
      <Icon :icon="getGatewayi18n('footer.icon')" class="size-3" />
      <span>
        {{ getGatewayi18n("footer.title") }}
      </span>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import config from "../../config.cva";
import { useStyles } from "@upmind-automation/upwind";

// --- components
import { Icon, Button } from "@upmind-automation/upwind";
import PaymentGateway from "../../PaymentGateway.vue";

// --- types
import type { ComputedRef } from "vue";

// --- props
const props = defineProps<{
  item: {
    gateway: {
      type: number;
      gateway_provider: {
        code: string;
      };
    };
  };
  meta: {
    hasGateway: boolean;
    isProcessing: boolean;
  };
  basketMeta: {
    isReadyForCheckout: boolean;
    isProcessingDetails: boolean;
  };
  model: {
    gateway_id: string;
  };
  gateway: {
    id: string;
    gateway_provider: {
      code: string;
    };
    type: number;
  };
  // ---
  color?: string;
}>();

const { t, te } = useI18n();

const emit = defineEmits(["checkout"]);

const styles = useStyles(["checkout"], {}, config) as ComputedRef<{
  checkout: {
    gateway: string;
    content: string;
    footer: string;
    action: string;
    additional: string;
  };
}>;

// TODO: Import gateway type from machine (we don't have it yet)
const getGatewayi18n = (property: string) => {
  const type = props.item.gateway.type;
  const code = props.item.gateway.gateway_provider?.code;
  if (type === 1) {
    const codeKey = `basket.${code}.${property}`;
    if (te(codeKey)) return t(codeKey);
    return t(`basket.${type}.${property}`);
  }

  return t(`basket.${type}.${property}`);
};

const handleCheckout = () => {
  emit("checkout");
};
</script>
