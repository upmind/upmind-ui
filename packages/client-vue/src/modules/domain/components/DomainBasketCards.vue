<template>
  <section :class="styles.domain.listings.root">
    <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty"></slot>

    <RadioCards
      v-else
      id="dac-basket"
      name="dac-basket"
      :class="styles.domain.listings.items"
      :items="items"
      required
      v-model="modelValue"
    >
      <template #item="{ item }"> {{ item.sld }}{{ item.tld }} </template>
    </RadioCards>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import {
  useStyles,
  type RadioCardsItemProps,
} from "@upmind-automation/upmind-ui";
import config from "./domain.config";

// --- components
import { RadioCards } from "@upmind-automation/upmind-ui";

// --- utils

// --- types
import { type ComputedRef } from "vue";
import { map } from "lodash-es";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const props = withDefaults(
  defineProps<{
    i18nKey?: string;
    modelValue?: string;
    items: string[];
    loading?: boolean;
    processing?: boolean;
    disabled?: boolean;
  }>(),
  {
    i18nKey: "domain.listings",
    modelValue: "",
    loading: false,
    processing: false,
    disabled: false,
  }
);

const modelValue = useVModel(props, "modelValue", emit);

const meta = computed(() => ({
  isLoading: props.loading,
  isEmpty: !props.items?.length,
  isDisabled: props.disabled,
  isProcessing: props.processing,
}));

const styles = useStyles(["domain.listings"], meta, config) as ComputedRef<{
  domain: {
    listings: {
      root: string;
      items: string;
    };
  };
}>;

const items = computed((): RadioCardsItemProps[] => {
  debugger;
  return map(props.items, (item, index) => ({
    item,
    index,
    modelValue: modelValue.value,
    value: item,
    label: item,
  }));
});
</script>
