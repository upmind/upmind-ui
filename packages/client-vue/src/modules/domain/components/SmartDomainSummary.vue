<template>
  <section
    :class="fieldSummaryRootVariants()"
    :data-disabled="disabled || undefined"
  >
    <RadioGroup
      model-value="selected"
      :items="[{ value: 'selected', label: domain }]"
      :ui="{
        option: fieldSummaryRowVariants(),
        control: fieldSummaryIndicatorVariants(),
        label: 'flex min-w-0 flex-1 items-center'
      }"
    >
      <template #item>
        <span :class="fieldSummaryDomainVariants()">{{ domain }}</span>
        <Link
          :disabled="disabled"
          :class="fieldSummaryChangeVariants()"
          @click="emit('change')"
        >
          {{ t("action.change") }}
        </Link>
      </template>
    </RadioGroup>
  </section>
</template>

<script setup lang="ts">
import { RadioGroup, Link } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import {
  fieldSummaryRootVariants,
  fieldSummaryRowVariants,
  fieldSummaryIndicatorVariants,
  fieldSummaryDomainVariants,
  fieldSummaryChangeVariants
} from "../smartDomainField.variants";
import type { SmartDomainSummaryProps } from "../types";

// -----------------------------------------------------------------------------

defineProps<SmartDomainSummaryProps>();

const emit = defineEmits<{
  (e: "change"): void;
}>();

const { t } = useI18n();
</script>
