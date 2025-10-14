<template>
  <Loading :active="!meta.isAvailable">
    <Accordion
      v-show="meta.isAvailable && !meta.isFree && meta.hasGateways"
      type="multiple"
      :class="styles.checkout.accordion.root"
      collapsible
    >
      <!-- Stored Payment Methods -->
      <component
        :is="props.as"
        :class="[!props.as && styles.checkout.accordion.card, props.class]"
        v-if="meta.hasStoredPaymentMethods"
      >
        <AccordionItem
          value="stored"
          :class="styles.checkout.accordion.item"
          :open="!model?.gateway_id"
          :disabled="!model?.gateway_id"
          asChild
        >
          <AccordionTrigger
            :class="styles.checkout.accordion.trigger.root"
            :open="!model?.gateway_id"
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
                    'rotate-180': !model?.gateway_id
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
              v-if="!model?.gateway_id && currency?.code"
              :key="currency.code"
              @checkout="handleCheckout"
              :class="styles.checkout.accordion.loading"
            />
          </AccordionContent>
        </AccordionItem>
      </component>

      <!-- Gateways -->
      <template v-for="item in gateways" :key="item.id">
        <component
          :is="props.as"
          :class="[!props.as && styles.checkout.accordion.card, props.class]"
        >
          <AccordionItem
            :value="item.gateway_id"
            :class="styles.checkout.accordion.item"
            :open="item.gateway_id === model?.gateway_id"
            :disabled="item.gateway_id === model?.gateway_id"
            asChild
          >
            <AccordionTrigger
              :class="styles.checkout.accordion.trigger.root"
              @click.stop="selectGateway(item.gateway_id)"
              :open="item.gateway_id === model?.gateway_id"
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
                      'rotate-180': item.gateway_id === model?.gateway_id
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
                v-if="item.gateway_id === model?.gateway_id && currency?.code"
                :key="currency.code"
                @checkout="handleCheckout"
                :class="styles.checkout.accordion.loading"
              />
            </AccordionContent>
          </AccordionItem>
        </component>
      </template>
    </Accordion>

    <component
      v-if="meta.isAvailable && meta.isFree"
      :is="props.as"
      :class="[!props.as && styles.checkout.isFree, props.class]"
    >
      <PaymentNotRequired @checkout="handleCheckout" />
    </component>

    <component
      v-else-if="meta.isAvailable && !meta.hasGateways"
      :is="props.as"
      :class="[!props.as && styles.checkout.isFree, props.class]"
    >
      <GatewaysUnavailable @checkout="handleCheckout" />
    </component>
  </Loading>
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
import { useStyles, Loading } from "@upmind-automation/upmind-ui";

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
import GatewaysUnavailable from "./PaymentGatewaysUnavailable.vue";

// --- types
import type { PaymentDetailsProps } from "../types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<PaymentDetailsProps>(), {
  as: "div",
  class: "bg-base "
});

const { t } = useI18n();

const { meta, model, input, clear, gateways, currency } =
  useBasketPaymentDetails();

const { checkout } = useBasket();
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
  if (!model.value) return;
  input({
    ...model.value,
    gateway_id: id
  });
};

const clearGateway = () => {
  clear();
};
</script>
