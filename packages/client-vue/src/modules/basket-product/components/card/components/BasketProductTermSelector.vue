<template>
  <div
    v-if="hasTerms && terms"
    :class="styles.product.summary.footer.terms.root"
    v-bind="rootTestAttrs"
  >
    <SelectCards
      v-model="selectedTerm"
      :items="parsedTerms"
      :disabled="disabled || processing"
      :placeholder="t('form.select_option.placeholder')"
      size="sm"
      :ui-config="{
        select: {
          trigger: [styles.product.summary.footer.terms.trigger],
          content: [styles.product.summary.footer.terms.content]
        }
      }"
    >
      <template #item="slotProps">
        {{ slotProps.label }}

        <CurrentPrice
          v-if="slotProps.item.meta?.useMonthlyFromPrice"
          :current-price="slotProps.item.price.currentPrice"
          :monthly-from-current-price="
            slotProps.item.price.monthlyFromCurrentPrice
          "
          :free="slotProps.item.meta?.free"
          use-monthly-from-price
          :ui-config="{
            pricing: { current: [styles.product.summary.footer.terms.price] }
          }"
        />
      </template>

      <template #dropdown-item="slotProps">
        <TermCard v-bind="slotProps.item" layout="inline" :summary="false" />
      </template>
    </SelectCards>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  parseBillingCycle,
  PriceDisplayTypes
} from "@upmind-automation/headless";
import {
  SelectCards,
  useStyles,
  useTestAttrs
} from "@upmind-automation/upmind-ui";
import TermCard from "../../../../product/components/terms/TermCard.vue";
import CurrentPrice from "../../../../product/components/pricing/CurrentPrice.vue";
import styleConfig from "../basketProduct.config";
import { map, toNumber } from "lodash-es";
import type { TermSelectorProps } from "./types";
import type { TermDetails } from "@upmind-automation/headless";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<TermSelectorProps>();

const emits = defineEmits(["update:modelValue"]);

const { t } = useI18n();

const styles = useStyles(["product.summary.footer.terms"], {}, styleConfig);

const rootTestAttrs = useTestAttrs({ key: "basket-product-term-selector" });

const hasTerms = computed(() => (props.terms?.length ?? 0) > 1);

const selectedTerm = computed({
  get: () => props.modelValue?.toString(),
  set: (value: string | undefined) => {
    if (props.disabled || !value) return;
    emits("update:modelValue", toNumber(value));
  }
});

const parsedTerms = computed<SelectCardsItemProps[]>(() =>
  map(props.terms, (term: TermDetails, index: number) => ({
    value: term.cycle?.toString() ?? "",
    label: t("text.term_duration", {
      duration: parseBillingCycle(term.cycle ?? 0).numeric
    }),
    item: term,
    index
  }))
);
</script>
