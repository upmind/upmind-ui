<template>
  <UpmCard class="flex w-full flex-col items-start gap-4" as="aside">
    <header
      class="text-emphasis-medium flex w-full flex-col space-y-6 text-sm font-medium leading-none"
      v-auto-animate
    >
      <div
        class="text-primary flex items-end justify-between text-lg font-medium leading-none"
        v-for="(item, index) in summary?.pricing"
        :key="`pricing-${index}`"
      >
        <span>{{ t("product.total") }}</span>
        <span>
          <span
            v-if="item.meta?.discounted"
            class="text-emphasis-medium mb-1 mt-1 block text-right text-xs line-through"
          >
            <span>
              {{ item.regularPrice }}
            </span>
          </span>
          <span
            class="text-lg font-medium"
            :class="{
              'opacity-0': meta.isLoading || meta.isCalculating,
            }"
          >
            {{ item.meta?.free ? t("product.free") : item.currentPrice }}
          </span>
        </span>
      </div>
    </header>

    <Separator class="mb-4 mt-6" />

    <div class="flex w-full flex-col items-center gap-4 gap-y-6 md:flex-row">
      <NumberField
        v-if="product?.quantifiable"
        :model-value="model.quantity"
        @update:modelValue="updateQuantity"
      />

      <Button
        block
        type="submit"
        color="secondary"
        :loading="meta.isProcessing"
        :disabled="meta.isLoading || meta.isCalculating || meta.isInvalid"
        :label="t('product.actions.resolve')"
        @click="doResolve"
      >
        <template #prepend>
          <Icon icon="cart" size="2xs" />
        </template>
      </Button>
    </div>
  </UpmCard>

  <ul v-auto-animate class="m-0 flex flex-col gap-y-4 p-6 text-sm">
    <!-- <li
      v-if="categorySummary"
      class="m-0 flex flex-wrap items-start gap-x-1.5 gap-y-1 p-0 leading-none text-emphasis-medium"
    >
      <Icon icon="location" size="2xs" class="mr-1 text-primary" />
      <span>{{ categorySummary.name }}</span>
    </li> -->
    <li
      v-if="hasSummaryDetails"
      class="text-base-foreground m-0 flex flex-nowrap items-start gap-x-1.5 gap-y-1 p-0 leading-none"
    >
      <Icon icon="configuration" size="2xs" class="text-secondary mr-1" />

      <ul class="m-0 flex flex-col gap-y-4 p-0 text-sm">
        <li
          v-if="termSummary"
          class="text-base-foreground m-0 flex flex-wrap items-baseline gap-x-1.5 space-y-1 p-0"
        >
          <span
            class="text-emphasis-medium basis-full text-xs leading-none"
            v-if="termSummary.category"
          >
            {{ termSummary.category }}
          </span>

          <strong class="text-base-foreground font-medium">
            {{
              te(`product.terms.cycle.${termSummary.cycle}`)
                ? t(`product.terms.cycle.${termSummary.cycle}`)
                : termSummary.name
            }}
          </strong>

          <!-- DEPRECATED PRICING FOR NOW -->
          <!-- <span class="text-xs opacity-75">
            {{
              termSummary.meta.free
                ? t("product.free") : `+ ${termSummary.currentPrice}`
            }}
          </span> -->
        </li>

        <template v-for="item in summaryItems" :key="item.name">
          <li
            class="text-base-foreground m-0 flex flex-wrap items-baseline gap-x-1.5 space-y-1 p-0"
          >
            <span
              class="text-emphasis-medium basis-full text-xs leading-none"
              v-if="item.category"
            >
              {{ item.category }}
            </span>

            <strong class="text-base-foreground font-medium">{{
              item.name ?? "&ndash;"
            }}</strong>

            <!-- DEPRECTED PRICE -->
            <!-- <span class="text-xs opacity-75" v-if="item.key == 'option'">
              {{ item.meta.free ?  t("product.free") : `+ ${item.currentPrice}` }}
            </span> -->

            <span class="text-emphasis-high text-xs" v-if="item.quantity > 1">
              {{ `x ${item.quantity}` }}
            </span>
          </li>
        </template>
      </ul>
    </li>
  </ul>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useProductConfig, UpmCard } from "@upmind-automation/client-vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- components
import {
  NumberField,
  Separator,
  Icon,
  Button,
} from "@upmind-automation/upmind-ui";

// --- utils
import { omitBy, find, isEmpty, map } from "lodash-es";

// --- types
// import type { ComputedRef } from "vue";
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------

const props = defineProps<{
  item: ActorRef<any, any>;
}>();

const emits = defineEmits(["resolve"]);

// ---
const { t, te } = useI18n();

const { product, summary, meta, lookups, model, updateQuantity } =
  useProductConfig(props.item);

const termSummary = computed(() => {
  return find(summary.value?.details, detail => detail.key === "term");
});

const hasSummaryDetails = computed(() => {
  return !isEmpty(termSummary.value) || !isEmpty(summaryItems.value);
});

const summaryItems = computed(() => {
  return omitBy(summary.value?.details, detail =>
    ["term", "category"].includes(detail.key)
  );
});
const terms = computed(() =>
  map(lookups.value?.terms, term => ({
    value: term.cyle,
    textValue: term.name,
  }))
);

// ---
const doResolve = async () => {
  emits("resolve", model.value);
};
</script>
