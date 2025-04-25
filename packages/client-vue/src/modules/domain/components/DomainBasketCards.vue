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
      <template #item="{ item }">
        {{ item.label }}
      </template>

      <template #dropdown-item="{ item }">
        {{ item.label }}
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
import { find, isEmpty, map } from "lodash-es";

// --- types
import { type ComputedRef } from "vue";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";
import type { DomainProduct } from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const props = withDefaults(
  defineProps<{
    i18nKey?: string;
    modelValue?: string;
    items: DomainProduct[];
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
  isEmpty: isEmpty(props.items),
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

const items = computed((): SelectCardsItemProps[] => {
  return map(props.items, (item, index) => ({
    index,
    item: item,
    modelValue: modelValue.value,
    value: item.domain,
    label: item.domain,
  }));
});
</script>
