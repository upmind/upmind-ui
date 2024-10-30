<template>
  <section :class="styles.domain.listings.root" v-auto-animate>
    <header :class="styles.domain.listings.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <Empty
      :title="t('domain.empty.title')"
      :text="t('domain.empty.text')"
      v-if="!meta.isLoading && meta.isEmpty"
    />

    <CheckboxCards
      v-if="(!meta.isLoading && !meta.isEmpty) || meta.isLoadingMore"
      :class="styles.domain.listings.items"
      no-input
      key="items"
      id="dac"
      name="dac"
      required
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :errors="errors"
      :model-value="safeValue"
    >
      <template #item="{ item: { value } }">
        <VCardDomain v-bind="getDomain(value as string)" />
      </template>
    </CheckboxCards>

    <SkeletonList
      v-if="meta.isLoading"
      :class="styles.domain.listings.loading"
      :rows="6"
      key="more"
    />
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import VCardDomain from "./DomainCard.vue";
import Empty from "./Empty.vue";
import { SkeletonList, CheckboxCards } from "@upmind/upwind";

// --- utils
import { get, includes, isArray, isNil, find } from "lodash-es";

// --- types
import { type ComputedRef } from "vue";
import type { CheckboxCardsItemProps } from "@upmind/upwind";

// -----------------------------------------------------------------------------
const emit = defineEmits(["update:modelValue", "toggle"]);

const props = withDefaults(
  defineProps<{
    i18nKey: string;
    modelValue?: string | string[];
    items: Record<string, any>[];
    offset?: number;
    // ---
    loading?: boolean;
    processing?: boolean;
    disabled?: boolean;
  }>(),
  {
    offset: 0,
    loading: false,
    processing: false,
    disabled: false,
  }
);

const { t, tm } = useI18n();

const meta = computed(() => ({
  isOpen: props.modelValue || !props.items?.length,
  isLoading: props.loading,
  isLoadingMore: props.loading && props.offset > 0,
  isEmpty: !props.items?.length,
  isDisabled: props.disabled,
  isProcessing: props.processing,
}));

const styles = useStyles(
  [
    "domain.listings",
    "domain.card",
    "domain.card.owned",
    "domain.card.basket",
    "domain.card.available",
    "domain.card.transfer",
    "domain.transitions.fade.enter",
    "domain.transitions.fade.leave",
  ],
  meta,
  config
);

const safeValue = computed(() => {
  return isNil(props.modelValue)
    ? []
    : isArray(props.modelValue)
      ? props.modelValue
      : [props.modelValue];
});

function getDomain(value: string) {
  debugger;
  return find(props.items, ["id", value]);
}

const translations = computed(() => {
  return tm(props.i18nKey);
});

const title = computed(() => {
  return get(translations, "title", "Select your domain");
});

function isSelected(value: string): boolean {
  return includes(props.modelValue, value);
}

function onUpdate(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("toggle", value);
}
</script>
