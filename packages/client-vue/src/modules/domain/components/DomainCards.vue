<template>
  <section :class="styles.domain.listings.root" v-auto-animate>
    <Empty
      :title="t('domain.empty.title')"
      :text="t('domain.empty.text')"
      v-if="!meta.isLoading && meta.isEmpty"
    />

    <CheckboxCards
      v-if="(!meta.isLoading && !meta.isEmpty) || meta.isLoadingMore"
      no-input
      id="dac"
      name="dac"
      as="ul"
      required
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :model-value="safeValue"
      item-class="p-0"
      cursor="default"
      class="gap-0"
      list
    >
      <template #item="{ item: { value } }">
        <DomainCard
          v-bind="getDomain(value.toString())"
          :selected="includes(props.modelValue, value)"
          :color="props.color"
          @update:selected="onToggleSelected"
          @remove="onRemove"
        />
      </template>
    </CheckboxCards>

    <template v-if="meta.isLoading">
      <section v-if="!results" :class="styles.domain.listings.loading">
        <Interstitial
          v-bind="props"
          :text="t('domain.dac.loading.text')"
          :modal="false"
          open
        >
          <template #avatar>
            <IconAnimated
              :icon="Internet"
              size="4xl"
              secondary-color="accent"
            />
          </template>
          <template #title>
            <SmartTitle i18n-key="domain.dac.loading.title" align="center" />
          </template>
        </Interstitial>
      </section>
      <template v-else>
        <DomainCardSkeleton v-for="i in results" :key="i" />
      </template>
    </template>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed, type ComputedRef, ref, watch } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";
import Internet from "../../../assets/animations/internet.json?url";

// --- components
import DomainCard from "./DomainCard.vue";
import Empty from "./Empty.vue";
import {
  IconAnimated,
  CheckboxCards,
  Interstitial,
} from "@upmind-automation/upmind-ui";
import SmartTitle from "../../../components/content/SmartTitle.vue";
import DomainCardSkeleton from "./DomainCardSkeleton.vue";
// --- utils
import { includes, isArray, isNil, find, map } from "lodash-es";

// --- types
import type { CheckboxCardsItemProps } from "@upmind-automation/upmind-ui";
import type { DomainCardsProps } from "../types";
import type { DomainProduct } from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------
// const emit = defineEmits(["update:modelValue", "update:selected"]);
const emit = defineEmits<{
  (e: "update:modelValue", model: DomainCardsProps["modelValue"]): void;
  (e: "update:selected", domain: string): void;
  (e: "remove", domain: string): void;
}>();

const props = withDefaults(defineProps<DomainCardsProps>(), {
  offset: 0,
  color: "base",
  loading: false,
  processing: false,
  disabled: false,
});

const { t } = useI18n();

const results = ref(0);
const minLoadingTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isMinLoadingActive = ref(false);

const meta = computed(() => ({
  isOpen: props.modelValue || !props.items?.length,
  isLoading: props.loading || isMinLoadingActive.value,
  isLoadingMore:
    (props.loading || isMinLoadingActive.value) && props.offset > 0,
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

function getDomain(value: string): DomainProduct {
  return find(props.items, ["value", value]) as DomainProduct;
}

const parsedValues = computed<CheckboxCardsItemProps[]>(() => {
  return map(props.items, item => {
    return {
      id: item.domain,
      value: item.domain,
      label: item.domain,
    };
  });
});

watch(parsedValues, items => {
  results.value = items?.length;
});

watch(
  () => props.loading,
  isLoading => {
    if (isLoading && results.value) {
      isMinLoadingActive.value = true;
      if (minLoadingTimer.value) {
        clearTimeout(minLoadingTimer.value);
      }
      minLoadingTimer.value = setTimeout(() => {
        isMinLoadingActive.value = false;
      }, 750);
    }
  },
  { immediate: true }
);

function onToggleSelected(domain: string) {
  if (meta.value.isProcessing) return;
  emit("update:selected", domain);
}

function onRemove(domain: string) {
  emit("remove", domain);
}
</script>
