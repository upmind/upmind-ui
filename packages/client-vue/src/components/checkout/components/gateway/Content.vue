<template>
  <PaymentGateway
    v-show="meta.hasGateway && gateway.gateway_id == model.gateway_id"
    :id="gateway.gateway_id"
    class="w-full"
  />

  <footer
    class="flex flex-col items-stretch justify-start space-x-0 space-y-2 md:flex-row md:space-x-4 md:space-y-0"
    v-auto-animate
  >
    <Button
      :disabled="!basketMeta.isReadyForCheckout || meta.isProcessing"
      :loading="basketMeta.isProcessingDetails"
      @click.prevent="handleCheckout"
      :label="getGatewayi18n('actions.submit')"
      class="block w-full self-center md:inline-block md:w-auto"
    />

    <div
      v-if="!getGatewayi18n('footer.title').includes('basket')"
      class="bg-base-background text-primary flex items-center justify-center space-x-2 self-stretch px-4 py-2 md:py-0"
    >
      <Icon :icon="getGatewayi18n('footer.icon')" class="size-3" />
      <div class="text-xs">
        {{ getGatewayi18n("footer.title") }}
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Icon } from "@upmind-automation/upwind";
import PaymentGateway from "../../PaymentGateway.vue";

// --- props
const props = defineProps<{
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
    gateway_id: string;
    type: number;
    gateway_provider: {
      code: string;
    };
  };
  // ---
  color?: string;
}>();

const { t, te } = useI18n();

const emit = defineEmits(["checkout"]);

// TODO: Import gateway type from machine (we don't have it yet)
const getGatewayi18n = (property: string) => {
  const type = props.gateway.type;
  const code = props.gateway.gateway_provider?.code;
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
