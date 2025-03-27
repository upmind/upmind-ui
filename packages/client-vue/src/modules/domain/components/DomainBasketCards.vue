<template>
  <section>
    <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty"></slot>

    <SelectCards
      v-else
      id="dac-basket"
      name="dac-basket"
      :class="styles.domain.form.items"
      :items="items"
      :disabled="meta.isDisabled"
      required
      v-model="modelValue"
      content-class="z-50"
    >
      <template #item>
        {{ getItem(modelValue)?.sld }}{{ getItem(modelValue)?.tld }}
      </template>
      <template #dropdown-item="{ item }">
        {{ getItem(item.value as string)?.sld
        }}{{ getItem(item.value as string)?.tld }}
      </template>
    </SelectCards>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";

// --- components
import { SelectCards } from "@upmind-automation/upmind-ui";

// --- utils
import { find, map } from "lodash-es";

// --- types
import { type ComputedRef } from "vue";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const props = withDefaults(
  defineProps<{
    i18nKey?: string;
    modelValue?: string;
    items: any[];
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

const styles = useStyles(["domain.form"], meta, config) as ComputedRef<{
  domain: {
    form: {
      items: string;
    };
  };
}>;

const getItem = (value: string) => {
  const found = find(props.items, { value });
  return found;
};

const items = computed((): SelectCardsItemProps[] => {
  return map(props.items, (item, index) => ({
    ...item,
    index,
    modelValue: modelValue.value,
    value: item.value,
    label: item.label,
  }));
});
</script>
