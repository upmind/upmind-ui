<template>
  <div
    v-if="hasTerms && terms"
    class="flex items-center gap-2"
    data-testid="basket-product-term-selector"
  >
    <Select
      v-model="selectedTerm"
      :items="parsedTerms"
      :disabled="disabled || processing"
      :placeholder="t('form.select_option.placeholder')"
      size="md"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { Select } from "@upmind-automation/upmind-ui";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- utils
import { map, toNumber } from "lodash-es";

// --- types
import type { TermDetails } from "@upmind-automation/headless";
import type { SelectItemProps } from "@upmind-automation/upmind-ui";
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

const selectedTerm = computed({
  get: () => props.modelValue?.toString(),
  set: (value: string | undefined) => {
    if (props.disabled || !value) return;
    emits("update:modelValue", toNumber(value));
  }
});

const parsedTerms = computed<SelectItemProps[]>(() =>
  map(props.terms, (item: TermDetails) => ({
    value: item.cycle?.toString() ?? "",
    label: parseBillingCycle(item.cycle ?? 0).numeric
  }))
);
</script>
