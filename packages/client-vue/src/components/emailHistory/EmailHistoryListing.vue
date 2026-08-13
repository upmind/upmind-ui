<template>
  <div>
    <div class="mb-8 flex gap-4">
      <div class="flex-1">
        <Input
          id="email-search"
          :model-value="query"
          :placeholder="t('text.email_search_placeholder')"
          :auto-focus="false"
          aria-label="Search products"
          @update:model-value="doQuery"
          icon="search-md"
          class="max-w-full flex-1 lg:max-w-xl"
        />
      </div>
      <div class="shrink-0 md:w-auto">
        <EmailHistorySort
          v-model:property="sortBy"
          v-model:direction="direction"
        />
      </div>
    </div>

    <div v-for="email in data" :key="email.id" class="mb-4">
      <div class="flex">
        <div class="pr-2">
          <Avatar
            v-bind="{
              src: email.recipient.imageUrl,
              alt: email.recipient.name
            }"
            size="md"
            class="cursor-pointer"
            focusable
          />
        </div>
        <div class="grow">
          <p>{{ email.subject }}</p>
          <p>To: {{ email.to }}</p>
          <p v-if="email.meta.isBounced">
            <strong>{{ t("text.email_bounced") }}</strong
            >:
            {{ email.dateBounced.relative }}
          </p>
          <p v-else-if="email.meta.isError">
            <strong>{{ t("text.send_failed") }}</strong
            >:
            {{ email.dateErrored.relative }}
          </p>
          <p v-else-if="email.meta.isSent">
            <strong>{{ t("text.email_sent") }}</strong
            >:
            {{ email.dateSent.relative }}
          </p>
          <p v-else>
            <strong>{{ t("text.sending") }}</strong>
          </p>
        </div>
        <Link
          :label="t('action.view')"
          size="sm"
          color="muted"
          tabindex="-1"
          class="pointer-events-auto ml-2 h-4"
          @click.stop.prevent="
            router.push({
              name: props.routeViewName,
              params: {
                emailId: email.id
              }
            })
          "
        />
      </div>
    </div>

    <Pagination
      v-bind="pagination"
      :meta="meta"
      :pagination-info="
        t('text.pagination_info', {
          page: '{page}',
          pages: '{pages}'
        })
      "
      @next="doNextPage"
      @prev="doPrevPage"
    />
  </div>
</template>

<script lang="ts" setup>
import { useUrlSearchParams } from "@vueuse/core";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  useClientReceivedEmails,
  DEBOUNCE_DELAY,
  ReceivedEmailsSortableProperties,
  RequestSortDirection,
  ScopeActorTypes,
  type SentEmailStatus
} from "@upmind-automation/headless";
import { Pagination, Link, Input, Avatar } from "@upmind-automation/upmind-ui";
import EmailHistorySort from "./EmailHistorySort.vue";
import { debounce, isArray, isEmpty } from "lodash-es";
import type { ReceivedEmailsSortProps, ReceivedEmailsProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    status?: SentEmailStatus;
    routeViewName?: string;
  }>(),
  {
    status: undefined,
    routeViewName: "account-email-history-view"
  }
);

const query = defineModel<ReceivedEmailsProps["query"] | undefined>("query");

const sortBy = defineModel<ReceivedEmailsSortProps["property"] | undefined>(
  "sort",
  {
    default: ReceivedEmailsSortableProperties.DEFAULT
  }
);

const direction = defineModel<ReceivedEmailsSortProps["direction"]>(
  "direction",
  {
    default: RequestSortDirection.ASC
  }
);

// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();

// --- state

const urlParams = useUrlSearchParams("history");
const urlPage = computed(() => Math.max(Number(urlParams.page), 1));

const history = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
const { data, pagination } = history.useContext();
const meta = history.useMeta();
const {
  isReady: getEmailHistory,
  filters,
  sort,
  nextPage,
  prevPage
} = history.useActions();

const lastProductCount = ref(10);

const doQuery = debounce((value: string | number | undefined) => {
  query.value = value?.toString().trim() || undefined;
}, DEBOUNCE_DELAY);

function doNextPage() {
  nextPage();
}

function doPrevPage() {
  prevPage();
}

watch(
  data,
  newData => {
    if (isArray(newData) && !isEmpty(newData)) {
      lastProductCount.value = newData.length;
    } else {
      lastProductCount.value = 10;
    }
  },
  { immediate: true }
);
watch(query, filters.query, { immediate: true });
watch(() => props.status, filters.status, { immediate: true });
watch(sortBy, value => sort(value, direction.value), { immediate: true });
watch(direction, value => sort(sortBy.value, value), { immediate: true });

watch(
  () => pagination.value.page,
  newPage => {
    if (newPage !== urlPage.value) {
      urlParams.page = String(newPage);
    }
  }
);

// Registered AFTER the `{ immediate: true }` watchers above, deliberately:
// their synchronous first run applies the tab filter/sort before this awaits
// the first fetch, so the initial request already carries them instead of
// firing unfiltered and being followed by a second, filtered one. The reason
// is that requirement alone — the filter must be applied before the first
// fetch escapes.
//
// This is NOT a product-catalogue precedent (citation corrected 2026-08-07).
// No product-catalogue consumer has a top-level `await` to order watchers
// against: WidgetGrid.vue, labs Paginated.vue and labs Infinite.vue all pass
// their filters as reactive constructor args instead. What IS mirrored from
// useProductCatalogue.ts is the shape — filters and sort applied synchronously
// through `{ immediate: true }` watchers with no intervening `await`.
await getEmailHistory();
</script>
