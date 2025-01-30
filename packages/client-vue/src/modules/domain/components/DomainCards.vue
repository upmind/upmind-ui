<template>
  <section :class="styles.domain.listings.root" v-auto-animate>
    <Empty
      :title="t('domain.empty.title')"
      :text="t('domain.empty.text')"
      v-if="!meta.isLoading && meta.isEmpty"
    />

    <CheckboxCards
      v-if="(!meta.isLoading && !meta.isEmpty) || meta.isLoadingMore"
      :class="styles.domain.listings.items"
      no-input
      id="dac"
      name="dac"
      as="ul"
      required
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :model-value="safeValue"
    >
      <template #item="{ item: { value } }">
        <CardDomain
          v-bind="getDomain(value as string)"
          :selected="isSelected(value as string)"
          @update:selected="onToggleSelected"
          :color="props.color"
        />
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
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import CardDomain from "./DomainCard.vue";
import Empty from "./Empty.vue";
import { SkeletonList, CheckboxCards } from "@upmind-automation/upmind-ui";

// --- utils
import { get, includes, isArray, isNil, find, map } from "lodash-es";

// --- types
import type { CheckboxCardsItemProps } from "@upmind-automation/upmind-ui";
import type { IDomain } from "./types";

// -----------------------------------------------------------------------------
const emit = defineEmits(["update:modelValue", "update:selected"]);

const props = withDefaults(
  defineProps<{
    i18n?: string;
    modelValue?: string | string[];
    items: Record<string, any>[];
    offset?: number;
    // ---
    color?: string;
    // ---
    loading?: boolean;
    processing?: boolean;
    disabled?: boolean;
  }>(),
  {
    offset: 0,
    color: "base",
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

const styles = useStyles(["domain.listings"], meta, config);

const safeValue = computed(() => {
  return isNil(props.modelValue)
    ? []
    : isArray(props.modelValue)
      ? props.modelValue
      : [props.modelValue];
});

function getDomain(value: string): IDomain {
  const domain = find(props.items, ["value", value]) as IDomain;
  return domain;
}

const parsedValues = computed<CheckboxCardsItemProps[]>(() => {
  return map(props.items, domain => {
    return {
      id: domain.value,
      value: domain.value,
      label: domain?.domain,
    };
  });
});

const translations = computed(() => {
  return tm(props.i18nKey);
});

const title = computed(() => {
  return get(translations, "title", "Select your domain");
});

function isSelected(value: string): boolean {
  return includes(props.modelValue, value);
}

function onToggleSelected(value?: string) {
  if (meta.value.isProcessing) return;
  emit("update:selected", value);
}
</script>
