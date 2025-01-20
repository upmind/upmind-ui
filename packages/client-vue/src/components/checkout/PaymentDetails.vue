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
            <header class="flex w-full items-center justify-between space-x-2">
              <h5
                class="text-primary text-left text-sm leading-tight no-underline"
              >
                {{ item.gateway.name }}
              </h5>

              <img
                :src="`/gateways/${item.gateway_id}.png`"
                :alt="item.gateway.name"
                class="m-0 h-6 md:h-7"
                @error="$event.target.style.display = 'none'"
              />
            </header>

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
              <VPaymentGateway
                v-if="meta.hasGateway && gateway.id == model.gateway_id"
                :id="gateway.id"
                class="w-full"
              />

              <footer
                class="flex flex-col items-stretch justify-start space-x-0 space-y-2 md:flex-row md:space-x-4 md:space-y-0"
                v-auto-animate
              >
                <Button
                  :disabled="
                    !basketMeta.isReadyForCheckout || meta.isProcessing
                  "
                  :loading="basketMeta.isProcessingDetails"
                  @click.prevent="handleCheckout"
                  :color="color"
                  :label="getGatewayi18n(item, 'actions.submit')"
                  class="block w-full self-center md:inline-block md:w-auto"
                />

                <div
                  v-if="
                    !getGatewayi18n(item, 'footer.title').includes('basket')
                  "
                  class="bg-base-background text-primary flex items-center justify-center space-x-2 self-stretch px-4 py-2 md:py-0"
                >
                  <Icon
                    :icon="getGatewayi18n(item, 'footer.icon')"
                    class="size-3"
                  />
                  <div class="text-xs">
                    {{ getGatewayi18n(item, "footer.title") }}
                  </div>
                </div>
              </footer>
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
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasketPaymentDetails,
  useBasket,
} from "@upmind-automation/client-vue";
import { UpmPaymentNotRequired } from "@upmind-automation/client-vue";

// --- components
import {
  Icon,
  Button,
  Loading,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@upmind-automation/upwind";

import VPaymentGateway from "./PaymentGateway.vue";

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

const { t, te } = useI18n();

const { meta, model, gateway, input, gateways, errors } =
  useBasketPaymentDetails();

const { meta: basketMeta, checkout } = useBasket();

const handleCheckout = () => {
  checkout();
};

// TODO: Import gateway type from machine (we don't have it yet)
const getGatewayi18n = (item: any, property: string) => {
  const type = item.gateway.type;
  const code = item.gateway.gateway_provider?.code;
  if (type === 1) {
    const codeKey = `basket.${code}.${property}`;
    if (te(codeKey)) return t(codeKey);
    return t(`basket.${type}.${property}`);
  }

  return t(`basket.${type}.${property}`);
};

const selectGateway = (id: string) => {
  const value = model.value;
  set(value, "gateway_id", id);
  input(value);
};
</script>
