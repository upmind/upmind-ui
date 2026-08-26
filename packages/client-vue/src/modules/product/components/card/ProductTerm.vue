<template>
  <fieldset v-if="prices && prices.length > 1">
    <Select
      :model-value="modelValue"
      :items="priceOptions"
      size="lg"
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
        <TermRow v-bind="option.price" />
      </template>
    </Select>
  </fieldset>
</template>

<script setup lang="ts">
import { Select } from "@upmind/ui";
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import TermRow from "../terms/TermRow.vue";
import type { ProductTerm } from "./types";

const props = defineProps<ProductTerm>();

const modelValue = useVModel(props, "modelValue");

const { t } = useI18n();

const priceOptions = computed(() =>
  (props.prices ?? []).map(price => ({
    value: String(price.cycle),
    price
  }))
);

const selectedLabel = computed(() => {
  const selected = props.prices?.find(
    price => String(price.cycle) === modelValue.value
  );
  if (!selected) return "";
  return parseBillingCycle(selected.cycle!).numeric;
});

function onSelect(value: unknown) {
  modelValue.value = String(value ?? "");
}
</script>
