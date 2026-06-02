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
// --- external
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useUrlSearchParams } from "@vueuse/core";

// --- internal
import {
  useClientReceivedEmails,
  DEBOUNCE_DELAY,
  ReceivedEmailsSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
// import { ROUTE } from "../../../router/types";

// --- components
import { Pagination, Link, Input, Avatar } from "@upmind-automation/upmind-ui";
import EmailHistorySort from "./EmailHistorySort.vue";

// --- utils
import { debounce, isArray, isEmpty } from "lodash-es";

// --- types
// import type { ComputedRef } from "vue";
import type { ReceivedEmailsSortProps, ReceivedEmailsProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    manualFilters: any;
    routeViewName?: string;
  }>(),
  {
    manualFilters: {},
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

const {
  isReady: getEmailHistory,
  data,
  meta,
  pagination,
  filters,
  sort,
  nextPage,
  prevPage
} = useClientReceivedEmails({
  pagination: {
    limit: 10,
    offset: (urlPage.value - 1) * 10
  },
  filters: props.manualFilters
});

await getEmailHistory();

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
</script>
