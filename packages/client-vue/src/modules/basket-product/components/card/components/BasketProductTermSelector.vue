<template>
  <div
    v-if="hasTerms && terms"
    class="flex items-center gap-2"
    data-testid="basket-product-term-selector"
  >
    <SelectCards
      id="inline-term"
      name="inline-term"
      :items="parsedTerms"
      :model-value="selectedTerm"
      :disabled="disabled || processing"
      :placeholder="t('form.select_option.placeholder')"
      content-class="max-h-74!"
      size="sm"
      @update:modelValue="doUpdateTerm"
    >
      <template #item="slotProps">
        <TermCard v-bind="slotProps.item" layout="inline" :summary="false" />
      </template>
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
import { SelectCards } from "@upmind-automation/upmind-ui";
import TermCard from "../../../product/components/terms/TermCard.vue";

// --- utils
import { map, toNumber } from "lodash-es";

// --- types
import type { TermDetails } from "@upmind-automation/headless";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<{
  /** Available billing terms. */
  terms: TermDetails[];
  /** Currently selected term cycle in months. */
  modelValue?: number;
  /** Whether the selector is disabled. */
  disabled?: boolean;
  /** Whether an update is processing. */
  processing?: boolean;
}>();

const emits = defineEmits(["update:modelValue"]);

const { t } = useI18n();

const hasTerms = computed(() => (props.terms?.length ?? 0) > 1);

const selectedTerm = computed(() => props.modelValue?.toString());

const parsedTerms = computed<SelectCardsItemProps[]>(() =>
  map(props.terms, (item: TermDetails, index: number) => ({
    id: item.cycle,
    value: item.cycle?.toString(),
    label: item.title,
    item,
    index,
    modelValue: selectedTerm.value
  }))
);

function doUpdateTerm(value: string | number) {
  if (props.disabled) return;
  emits("update:modelValue", toNumber(value));
}
</script>
