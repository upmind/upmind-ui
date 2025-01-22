<template>
  <Accordion
    v-show="!meta.isFree"
    type="multiple"
    class="flex flex-col gap-4"
    collapsible
  >
    <template v-for="item in gateways" :key="item.id">
      <component
        :is="props.cardComponent"
        :class="[!props.cardComponent && 'bg-base shadow-sm', props.class]"
      >
        <AccordionItem
          :value="item.gateway_id"
          class="border-none"
          :open="item.gateway_id === model.gateway_id"
          :disabled="item.gateway_id === model.gateway_id"
        >
          <AccordionTrigger
            class="text-emphasis-medium hover:text-primary flex items-center justify-between space-x-2 p-4 px-6 transition-all duration-300 hover:no-underline md:p-5 md:px-9"
            @click.stop="selectGateway(item.gateway_id)"
          >
            <GatewayTrigger v-bind="item" />

            <template #icon>
              <Icon
                icon="arrow-down"
                class="h-6 w-6 shrink-0 transition-transform duration-200"
                :class="{
                  'rotate-180': item.gateway_id === model.gateway_id,
                }"
              />
            </template>
          </AccordionTrigger>

          <Loading
            :active="
              item.gateway_id === model.gateway_id && basketMeta.isProcessing
            "
            class="text-secondary"
          >
            <AccordionContent
              class="border-base-muted flex flex-col border-t p-5 px-6 transition-all duration-300 md:p-8 md:px-9"
            >
              <GatewayContent
                :gateway="item"
                :model="model"
                :meta="meta"
                :basket-meta="basketMeta"
                :color="color"
                @checkout="handleCheckout"
              />
            </AccordionContent>
          </Loading>
        </AccordionItem>
      </component>
    </template>
  </Accordion>

  <component
    v-if="meta.isFree"
    :is="props.cardComponent"
    :class="[!props.cardComponent && 'bg-base shadow-sm', props.class]"
  >
    <UpmPaymentNotRequired />
  </component>
</template>

<script lang="ts" setup>
// --- internal
import {
  useBasketPaymentDetails,
  useBasket,
} from "@upmind-automation/client-vue";
import { UpmPaymentNotRequired } from "@upmind-automation/client-vue";

// --- components
import {
  Loading,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Icon,
} from "@upmind-automation/upwind";
import GatewayTrigger from "./components/gateway/Trigger.vue";
import GatewayContent from "./components/gateway/Content.vue";

// --- types
import type { PaymentDetailsProps } from "./types";

// --- utils
import { set } from "lodash-es";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<PaymentDetailsProps>(), {
  color: "secondary",
  cardComponent: "div",
  class: "bg-base shadow-sm",
});

const { meta, model, gateway, input, gateways } = useBasketPaymentDetails();

const { meta: basketMeta, checkout } = useBasket();

const handleCheckout = () => {
  checkout();
};

const selectGateway = (id: string) => {
  const value = model.value;
  set(value, "gateway_id", id);
  input(value);
};
</script>
