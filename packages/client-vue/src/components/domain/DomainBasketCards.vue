<template>
  <section :class="styles.domain.listings.root">
    <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty">
      <Empty />
    </slot>

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
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import Empty from "./Empty.vue";
import { RadioCards } from "@upmind/upwind";

// --- utils

// --- types

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:modelValue"]);

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

const styles = useStyles(["domain.listings"], meta, config);
</script>
