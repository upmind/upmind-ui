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
          @update:selected="onToggleSelected"
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
import { computed, type ComputedRef } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "./domain.config";

// --- components
import CardDomain from "./DomainCard.vue";
import Empty from "./Empty.vue";
import { SkeletonList, CheckboxCards } from "@upmind-automation/upmind-ui";

// --- utils
import { get, includes, isArray, isNil, find, map } from "lodash-es";

// --- types
import type { CheckboxCardsItemProps } from "@upmind-automation/upmind-ui";
import type { DomainCardProps, DomainCardsProps } from "./types";

// -----------------------------------------------------------------------------
// const emit = defineEmits(["update:modelValue", "update:selected"]);
const emit = defineEmits<{
  (e: "update:modelValue", model: DomainCardsProps["modelValue"]): void;
  (e: "update:selected", domain: string): void;
}>();

const props = withDefaults(defineProps<DomainCardsProps>(), {
  offset: 0,
  color: "base",
  loading: false,
  processing: false,
  disabled: false,
});

const { t } = useI18n();

const meta = computed(() => ({
  isOpen: props.modelValue || !props.items?.length,
  isLoading: props.loading,
  isLoadingMore: props.loading && props.offset > 0,
  isEmpty: !props.items?.length,
  isDisabled: props.disabled,
  isProcessing: props.processing,
}));

const styles = useStyles(["domain.listings"], meta, config) as ComputedRef<{
  domain: {
    listings: {
      root: string;
      items: string;
      loading: string;
    };
  };
}>;

const safeValue = computed(() => {
  return isNil(props.modelValue)
    ? []
    : isArray(props.modelValue)
      ? props.modelValue
      : [props.modelValue];
});

function getDomain(value: string): DomainCardProps {
  const domain = find(props.items, ["value", value]) as DomainCardProps;
  domain.selected = includes(props.modelValue, value);
  domain.color = props.color;
  return domain;
}

const parsedValues = computed<CheckboxCardsItemProps[]>(() => {
  debugger;
  return map(props.items, item => {
    debugger;
    return {
      id: item.value ?? "",
      value: item.value ?? "",
      label: item.domain,
    };
  });
});

function onToggleSelected(domain: string) {
  if (meta.value.isProcessing) return;
  emit("update:selected", domain);
}
</script>
