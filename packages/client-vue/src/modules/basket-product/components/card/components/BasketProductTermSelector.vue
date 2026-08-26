<template>
  <div
    v-if="hasTerms && terms"
    class="w-full"
    data-test-key="basket-product-term-selector"
  >
    <Select
      :model-value="selectedTerm"
      :items="termOptions"
      :disabled="disabled || processing"
      size="md"
      class="w-full"
      @update:model-value="onSelect"
    >
      <template #value>
        <span v-if="selectedLabel">{{ selectedLabel }}</span>
        <span v-else class="text-muted">{{
          t("form.select_option.placeholder")
        }}</span>
      </template>
      <template #item="{ option }">
        <TermRow v-bind="option.term" :type="PriceDisplayTypes.CYCLE" />
      </template>
    </Select>
  </div>
</template>

<script lang="ts" setup>
import { Select } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  parseBillingCycle,
  PriceDisplayTypes
} from "@upmind-automation/headless";
import TermRow from "../../../../product/components/terms/TermRow.vue";
import { toNumber } from "lodash-es";
import type { TermSelectorProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<TermSelectorProps>();

const emits = defineEmits(["update:modelValue"]);

const { t } = useI18n();

const hasTerms = computed(() => (props.terms?.length ?? 0) > 1);

const selectedTerm = computed(() => props.modelValue?.toString());

const termOptions = computed(() =>
  (props.terms ?? []).map(term => ({
    value: term.cycle?.toString() ?? "",
    term
  }))
);

const selectedLabel = computed(() => {
  const selected = props.terms?.find(
    term => term.cycle?.toString() === props.modelValue?.toString()
  );
  if (!selected) return "";
  return t("text.term_duration", {
    duration: parseBillingCycle(selected.cycle ?? 0).numeric
  });
});

function onSelect(value: unknown) {
  if (props.disabled || !value) return;
  emits("update:modelValue", toNumber(value));
}
</script>
