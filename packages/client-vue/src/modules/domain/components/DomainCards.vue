<template>
  <section
    :class="[
      domainListingsRootVariants(),
      { 'grid flex-1 grid-rows-1': meta.isDrawer }
    ]"
  >
    <!-- Loader and results overlay in one grid cell (drawer). The loader is
         painted first (a background layer) and the results second, so the
         interactive list sits on top and receives clicks — no pointer-events
         override. Each has its own full-cell auto-animate wrapper, so
         auto-animate fades each in place on add/remove rather than morphing the
         loader's position into the list. -->
    <div
      v-auto-animate
      :class="{
        'col-start-1 row-start-1 flex items-center justify-center':
          meta.isDrawer
      }"
    >
      <Interstitial
        :close-label="t('action.close')"
        v-if="
          !meta.hasAvailable &&
          meta.isSearching &&
          (meta.isDrawer || !resultCount)
        "
        v-bind="props"
        :class="domainListingsInterstitialVariants(interstitialMeta)"
        :text="t('text.moment_short_desc')"
        :modal="false"
        :title="t('domain.finding_perfect_domain_md')"
        open
      >
        <template #icon>
          <AnimatedIcon icon="internet" size="xl" />
        </template>
      </Interstitial>
    </div>

    <div v-auto-animate :class="{ 'col-start-1 row-start-1': meta.isDrawer }">
      <ul
        v-if="meta.hasAvailable"
        id="dac"
        class="flex w-full flex-col gap-0"
        data-test-key="dac-results"
        v-auto-animate
      >
        <li
          v-for="item in props.items"
          :key="item.domain"
          :class="domainListingsItemVariants()"
          data-test-key="checkbox-item"
          :data-test-value="item.domain"
        >
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
            :transferOptionIsFree="item.meta.transferOptionIsFree"
            :unavailable="item.meta.unavailable"
            :priceLoading="item.meta.priceLoading"
            :exactMatch="isExactMatch(item.domain)"
            data-test-key="dac-card"
            @add="onAdd"
            @remove="onRemove"
          />
        </li>
      </ul>

      <Button
        v-if="meta.hasMoreSearchResults || meta.isSearchingMore"
        variant="outline"
        :loading="meta.isLoading || meta.isSearchingMore"
        :disabled="meta.isSearchingMore"
        @click="$emit('search-more')"
        block
        class="mt-6"
        :data-attrs="{ 'data-test-key': 'button-load-more' }"
      >
        {{ t("action.load_more") }}
      </Button>
    </div>

    <template v-if="!meta.hasAvailable && !meta.isSearching && !resultCount">
      <DomainCardSkeleton v-for="i in skeletonCount" :key="i" :active="false" />
    </template>

    <template
      v-if="
        !meta.hasAvailable &&
        meta.isSearching &&
        !(meta.isDrawer || !resultCount)
      "
    >
      <DomainCardSkeleton v-if="meta.hasTLD" is-exact-match />

      <DomainCardSkeleton v-for="i in resultsSkeletonCount" :key="i" />
    </template>
  </section>
</template>

<script lang="ts" setup>
import { vAutoAnimate } from "@formkit/auto-animate";
import { AnimatedIcon } from "@upmind/ui";
import { Interstitial } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { DOMAIN_TEMPLATE } from "../types";
import {
  domainListingsRootVariants,
  domainListingsItemVariants,
  domainListingsInterstitialVariants
} from "../variants";
import DomainCard from "./DomainCard.vue";
import DomainCardSkeleton from "./DomainCardSkeleton.vue";
import { find, some, isEmpty } from "lodash-es";
import type { DomainCardsProps } from "../types";

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
  isDrawer: props.template === DOMAIN_TEMPLATE.DRAWER,
  hasAvailable: !isEmpty(props.items),
  // Prefer the explicit hasMore flag (page < totalPages) when supplied —
  // falls back to legacy offset/resultCount math.
  hasMoreSearchResults:
    props.hasMore ??
    (props.resultCount ?? 0) > (props.offset ?? 0) + (props.items?.length ?? 0),
  hasTLD: !!props.query?.includes("."),
  hasExactMatch: some(props.items, item => !!item.meta.exactMatch)
}));

const interstitialMeta = computed<{ padding: "none" | "md" | "lg" }>(() => ({
  padding: props.template === DOMAIN_TEMPLATE.DRAWER ? "lg" : "none"
}));

const resultsSkeletonCount = computed(() => {
  let count = props.resultCount;
  return meta.value.hasTLD ? count - 1 : count;
});

function isExactMatch(value: string): boolean {
  const domain = find(props.items, ["domain", value]);
  return !!domain?.meta.exactMatch;
}

function onAdd(domain: string) {
  emit("add", domain);
}

function onRemove(domain: string) {
  emit("remove", domain);
}
</script>
