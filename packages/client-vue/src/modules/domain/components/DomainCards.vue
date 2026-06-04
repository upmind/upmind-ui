<template>
  <section :class="styles.domain.listings.root" v-auto-animate>
    <CheckboxCards
      v-if="meta.hasAvailable"
      no-input
      id="dac"
      name="dac"
      as="ul"
      required
      :items="parsedValues"
      :disabled="props.disabled"
      :model-value="safeValue"
      item-class="p-0"
      cursor="default"
      class="gap-0"
      list
      data-testid="dac-results"
      :ui-config="
        {
          checkboxCards: {
            item: [styles.domain.listings.item]
          }
        } as any
      "
    >
      <template #item="{ item: { item, value } }">
        <DomainCard
          :domain="item.domain"
          :sld="item.sld"
          :tld="item.tld"
          :price="item.price"
          :cycle="item.configuration.term"
          :disabled="
            item.meta.disabled || props.disabled || meta.isSearchingMore
          "
          :processing="item.meta.processing"
          :available="item.meta.available"
          :added="item.meta.added"
          :owned="item.meta.owned"
          :discounted="item.meta.discounted"
          :free="item.meta.free"
          :canTransfer="item.meta.canTransfer"
          :transferLabel="item.meta.transferLabel"
          :transferOptionPrice="item.meta.transferOptionPrice"
          :unavailable="item.meta.unavailable"
          :priceLoading="item.meta.priceLoading"
          :exactMatch="isExactMatch(value.toString())"
          @add="onAdd"
          @remove="onRemove"
          data-testid="dac-card"
        />
      </template>
    </CheckboxCards>

    <Interstitial
      v-else-if="meta.isSearching && !resultCount"
      v-bind="props"
      :class="styles.domain.listings.interstitial"
      :text="t('text.moment_short_desc')"
      :modal="false"
      :title="t('domain.finding_perfect_domain_md')"
      open
    >
      <template #avatar>
        <IconAnimated icon="internet" size="4xl" secondary-color="accent" />
      </template>
    </Interstitial>

    <template v-else-if="!meta.isSearching && !resultCount">
      <DomainCardSkeleton v-for="i in skeletonCount" :key="i" :active="false" />
    </template>

    <template v-else-if="meta.isSearching">
      <DomainCardSkeleton v-if="meta.hasTLD" is-exact-match />

      <DomainCardSkeleton v-for="i in resultsSkeletonCount" :key="i" />
    </template>

    <Button
      v-if="meta.hasMoreSearchResults || meta.isSearchingMore"
      variant="outline"
      :loading="meta.isLoading || meta.isSearchingMore"
      :disabled="meta.isSearchingMore"
      @click="$emit('search-more')"
      block
      class="mt-6"
    >
      {{ t("action.load_more") }}
    </Button>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";

// --- components
import DomainCard from "./DomainCard.vue";
import {
  IconAnimated,
  CheckboxCards,
  Interstitial,
  Button
} from "@upmind-automation/upmind-ui";
import DomainCardSkeleton from "./DomainCardSkeleton.vue";

// --- utils
import { includes, isArray, isNil, find, some, map, isEmpty } from "lodash-es";

// --- types
import type { CheckboxCardsItemProps } from "@upmind-automation/upmind-ui";
import type { DomainCardsProps } from "../types";
import { DOMAIN_TEMPLATE } from "../types";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "add", domain: string): void;
  (e: "remove", domain: string): void;
  (e: "search-more"): void;
}>();

const props = withDefaults(defineProps<DomainCardsProps>(), {
  resultCount: 0,
  skeletonCount: 3,
  offset: 0,
  loading: false,
  searching: false,
  valid: false,
  disabled: false
});

const { t } = useI18n();

const meta = computed(() => ({
  isLoading: props.loading ?? false,
  isProcessing: props.processing ?? false,
  isSearching: props.searching ?? false,
  isSearchingMore: props.searchingMore ?? false,
  isValid: props.valid ?? false,
  hasAvailable: !isEmpty(props.items),
  // Prefer the explicit hasMore flag (page < totalPages) when supplied —
  // falls back to legacy offset/resultCount math.
  hasMoreSearchResults:
    props.hasMore ??
    (props.resultCount ?? 0) > (props.offset ?? 0) + (props.items?.length ?? 0),
  hasTLD: !!props.query?.includes("."),
  hasExactMatch: some(props.items, item => !!item.meta.exactMatch)
}));

const stylesMeta = computed(() => ({
  padding: props.template === DOMAIN_TEMPLATE.DRAWER ? "lg" : "none",
  hasExactMatch: meta.value.hasExactMatch
}));

const styles = useStyles(["domain.listings"], stylesMeta, config);

const safeValue = computed(() => {
  return isNil(props.modelValue)
    ? []
    : isArray(props.modelValue)
      ? props.modelValue
      : [props.modelValue];
});

const resultsSkeletonCount = computed(() => {
  let count = props.resultCount;
  return meta.value.hasTLD ? count - 1 : count;
});

function isExactMatch(value: string): boolean {
  const domain = find(props.items, ["domain", value]);
  return !!domain?.meta.exactMatch;
}

const parsedValues = computed<CheckboxCardsItemProps[]>(() => {
  return map(props.items, item => {
    return {
      id: item.domain,
      value: item.domain,
      label: item.domain,
      item
    };
  });
});

function onAdd(domain: string) {
  emit("add", domain);
}

function onRemove(domain: string) {
  emit("remove", domain);
}
</script>
