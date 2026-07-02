<template>
  <UpmLayout :variant="layout">
    <template #actions></template>

    <template #content-header>
      <h1>
        <i18n-t keypath="text.email_history" tag="span" scope="global" />
      </h1>
    </template>

    <template #default>
      <UpmSection :label="t('text.email_history')">
        <i18n-t keypath="text.email_history_msg" tag="h1" />
        <UpmSections
          v-model="active"
          :sections="sections"
          data-test-key="emailHistory"
        />
        <EmailHistoryListing
          :manual-filters="filters"
          v-model:sort="params.sort"
          v-model:direction="params.direction"
          v-model:query="params.query"
          :route-view-name="props.routeViewName"
        />
      </UpmSection>
    </template>

    <template #aside>
      <pre>{{ { route } }}</pre>
    </template>
  </UpmLayout>
</template>
<script lang="ts" setup>
import { useUrlSearchParams } from "@vueuse/core";
import { useRouteQuery } from "@vueuse/router";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useActiveSession } from "@upmind-automation/headless";
import { UpmLayout } from "../layout";
import { LAYOUT_VARIANTS } from "../layout/types";
import { UpmSection, UpmSections } from "../section";
import EmailHistoryListing from "./EmailHistoryListing.vue";
import type {
  ReceivedEmailsSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import type { TabItem } from "@upmind-automation/upmind-ui";

const props = withDefaults(defineProps<{ routeViewName?: string }>(), {
  routeViewName: "account-email-history-view"
});

// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();
const { isReady } = useActiveSession().useActions();
await isReady();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});

const active = useRouteQuery<string | undefined>("active", undefined, {
  mode: "push"
});

const params = useUrlSearchParams<{
  sort?: ReceivedEmailsSortableProperties;
  direction?: RequestSortDirection;
  query?: string;
}>("history", {
  removeNullishValues: true,
  removeFalsyValues: true
});

const filters = computed(() => {
  switch (active.value) {
    case "sent":
      return {
        "filter[sent]": "true",
        "filter[bounced]": "false"
      };
    case "bounced":
      return {
        "filter[bounced]": "true"
      };
    case "failed":
      return {
        "filter[error_id|neq]": "null"
      };
    default:
      return {};
  }
});

const sections = computed<TabItem[]>(() => {
  const tabs = [
    {
      label: t("text.all"),
      value: "all"
    },
    {
      label: t("text.sent"),
      value: "sent"
    },
    {
      label: t("text.bounced"),
      value: "bounced"
    },
    {
      label: t("text.failed"),
      value: "failed"
    }
  ];

  return tabs;
});
</script>
