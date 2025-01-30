<template>
  <Accordion
    v-show="!meta.isFree"
    type="multiple"
    :class="styles.checkout.accordion.root"
    collapsible
  >
    <template v-for="item in gateways" :key="item.id">
      <component
        :is="props.cardComponent"
        :class="[
          !props.cardComponent && styles.checkout.accordion.card,
          props.class,
        ]"
      >
        <AccordionItem
          :value="item.gateway_id"
          :class="styles.checkout.accordion.item"
          :open="item.gateway_id === model.gateway_id"
          :disabled="item.gateway_id === model.gateway_id"
        >
          <AccordionTrigger
            :class="styles.checkout.accordion.trigger.root"
            @click.stop="selectGateway(item.gateway_id)"
          >
            <GatewayTrigger v-bind="item" />

            <template #icon>
              <Icon
                icon="arrow-down"
                :class="[
                  styles.checkout.accordion.trigger.icon,
                  {
                    'rotate-180': item.gateway_id === model.gateway_id,
                  },
                ]"
              />
            </template>
          </AccordionTrigger>

          <Loading
            :active="
              item.gateway_id === model.gateway_id && basketMeta.isProcessing
            "
            :class="styles.checkout.accordion.loading"
          >
            <AccordionContent :class="styles.checkout.accordion.content">
              <GatewayContent
                :item="item"
                :gateway="gateway"
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
    :class="[!props.cardComponent && styles.checkout.isFree, props.class]"
  >
    <UpmPaymentNotRequired />
  </component>
</template>

<script lang="ts" setup>
// --- internal
import {
  useBasketPaymentDetails,
  useBasket,
} from "@upmind-automation/headless-vue";
import config from "./config.cva";
import { useStyles } from "@upmind-automation/upmind-ui";
import UpmPaymentNotRequired from "./PaymentNotRequired.vue";

// --- components
import {
  Loading,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Icon,
} from "@upmind-automation/upmind-ui";
import GatewayTrigger from "./components/gateway/Trigger.vue";
import GatewayContent from "./components/gateway/Content.vue";

// --- types
import type { PaymentDetailsProps } from "./types";
import type { ComputedRef } from "vue";

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

const styles = useStyles(
  ["checkout", "checkout.accordion", "checkout.accordion.trigger"],
  {},
  config
) as ComputedRef<{
  checkout: {
    accordion: {
      root: string;
      trigger: {
        root: string;
        icon: string;
      };
      item: string;
      card: string;
      loading: string;
      content: string;
    };
    isFree: string;
  };
}>;

const handleCheckout = () => {
  checkout();
};

const selectGateway = (id: string) => {
  const value = model.value;
  set(value, "gateway_id", id);
  input(value);
};
</script>
