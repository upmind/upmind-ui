<template>
  <div
    v-if="hasTerms && terms"
    :class="styles.product.summary.footer.terms.root"
    data-testid="basket-product-term-selector"
  >
    <SelectCards
      v-model="selectedTerm"
      :items="parsedTerms"
      :disabled="disabled || processing"
      :placeholder="t('form.select_option.placeholder')"
      :ui-config="{
        select: {
          content: [styles.product.summary.footer.terms.content]
        }
      }"
    >
      <template #dropdown-item="slotProps">
        <TermCard v-bind="slotProps.item" layout="inline" :summary="false" />
      </template>
    </SelectCards>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { SelectCards, useStyles } from "@upmind-automation/upmind-ui";
import TermCard from "../../../../product/components/terms/TermCard.vue";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";
import styleConfig from "../basketProduct.config";

// --- utils
import { map, toNumber } from "lodash-es";

// --- types
import type { TermDetails } from "@upmind-automation/headless";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";
import type { TermSelectorProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<TermSelectorProps>();

const emits = defineEmits(["update:modelValue"]);

const { t } = useI18n();

const styles = useStyles(["product.summary.footer.terms"], {}, styleConfig);

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
    label: parseBillingCycle(term.cycle ?? 0).numeric,
    item: term,
    index
  }))
);
</script>
