<template>
  <Accordion
    v-show="!meta.isFree"
    type="multiple"
    :class="styles.checkout.accordion.root"
    collapsible
  >
    <component
      :is="props.as"
      :class="[!props.as && styles.checkout.accordion.card, props.class]"
    >
      <AccordionItem
        v-if="meta.hasStoredPaymentMethods"
        value="stored"
        :class="styles.checkout.accordion.item"
        :open="!model?.gatewayId || true"
        :disabled="!model?.gatewayId"
        asChild
      >
        <AccordionTrigger
          :class="styles.checkout.accordion.trigger.root"
          :open="!model?.gatewayId || true"
          @click.stop="clearGateway()"
        >
          <header :class="styles.checkout.accordion.trigger.header">
            <h5 :class="styles.checkout.title">
              {{ t("cart.pay_with_stored") }}
            </h5>
          </header>

          <template #icon>
            <Icon
              icon="arrow-down"
              size="xs"
              :class="[
                styles.checkout.accordion.trigger.icon,
                {
                  'rotate-180': !model?.gatewayId
                }
              ]"
            />
          </template>
        </AccordionTrigger>

        <AccordionContent
          :class="styles.checkout.accordion.content"
          :contentClass="styles.checkout.accordion.contentInner"
          force-mount
        >
          <StoredPayments
            v-if="!model?.gatewayId && currency?.code"
            :key="currency.code"
            :color="color"
            @checkout="handleCheckout"
            :class="styles.checkout.accordion.loading"
          />
        </AccordionContent>
      </AccordionItem>
    </component>

    <template v-for="item in gateways" :key="item.id">
      <component
        :is="props.as"
        :class="[!props.as && styles.checkout.accordion.card, props.class]"
      >
        <AccordionItem
          :value="item.gateway_id"
          :class="styles.checkout.accordion.item"
          :open="item.gateway_id === model?.gatewayId"
          :disabled="item.gateway_id === model?.gatewayId"
          asChild
        >
          <AccordionTrigger
            :class="styles.checkout.accordion.trigger.root"
            @click.stop="selectGateway(item.gateway_id)"
            :open="item.gateway_id === model?.gatewayId"
          >
            <header :class="styles.checkout.accordion.trigger.header">
              <h5 :class="styles.checkout.title">
                {{ item.gateway.name }}
              </h5>

              <Icon
                v-if="item.gateway?.gateway_provider?.code"
                :class="styles.checkout.image"
                :icon="{
                  path: `/gateways/`,
                  name: item.gateway?.gateway_provider?.code
                }"
              />
            </header>

            <template #icon>
              <Icon
                icon="arrow-down"
                size="xs"
                :class="[
                  styles.checkout.accordion.trigger.icon,
                  {
                    'rotate-180': item.gateway_id === model?.gatewayId
                  }
                ]"
              />
            </template>
          </AccordionTrigger>

          <AccordionContent
            :class="styles.checkout.accordion.content"
            :contentClass="styles.checkout.accordion.contentInner"
            force-mount
          >
            <PaymentGateway
              v-if="item.gateway_id === model?.gatewayId && currency?.code"
              :key="currency.code"
              :color="color"
              @checkout="handleCheckout"
              :class="styles.checkout.accordion.loading"
            />
          </AccordionContent>
        </AccordionItem>
      </component>
    </template>
  </Accordion>

  <component
    v-if="meta.isFree"
    :is="props.as"
    :class="[!props.as && styles.checkout.isFree, props.class]"
  >
    <PaymentNotRequired />
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasketPaymentDetails,
  useBasket,
  useBrand
} from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Icon
} from "@upmind-automation/upmind-ui";
import PaymentGateway from "./PaymentGateway.vue";
import StoredPayments from "./StoredPayments.vue";
import PaymentNotRequired from "./PaymentNotRequired.vue";

// --- types
import type { PaymentDetailsProps } from "../types";
import type { ComputedRef } from "vue";

// --- utils

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<PaymentDetailsProps>(), {
  color: "secondary",
  as: "div",
  class: "bg-base "
});

const { t } = useI18n();

const {
  meta,
  model,
  gateway,
  input,
  clear,
  gateways,
  currency,
  storedPaymentMethods
} = useBasketPaymentDetails();

const { meta: basketMeta, checkout } = useBasket();
const { uiCart } = useBrand();

const configMeta = computed(() => ({
  layout: uiCart.value?.layout || "default"
}));

const styles = useStyles(
  ["checkout", "checkout.accordion", "checkout.accordion.trigger"],
  configMeta,
  config
) as ComputedRef<{
  checkout: {
    accordion: {
      root: string;
      trigger: {
        root: string;
        header: string;
        icon: string;
      };
      item: string;
      card: string;
      loading: string;
      content: string;
      contentInner: string;
    };
    title: string;
    image: string;
    isFree: string;
  };
}>;

const handleCheckout = () => {
  checkout();
};

const selectGateway = (id: string) => {
  debugger;
  if (!model.value) return;
  debugger;
  input({
    ...model.value,
    gatewayId: id
  });
};

const clearGateway = () => {
  debugger;
  clear();
};
</script>
