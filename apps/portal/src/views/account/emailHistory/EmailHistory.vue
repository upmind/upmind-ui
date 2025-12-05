<template>
  <Layout :variant="layout">
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
          data-testid="emailHistory"
        />
        <EmailHistoryListing
          :manual-filters="filters"
          v-model:sort="params.sort"
          v-model:direction="params.direction"
          v-model:query="params.query"
        />
      </UpmSection>
    </template>

    <template #aside>
      <pre>{{ { meta, currentRoute } }}</pre>
    </template>
  </Layout>
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouteQuery } from "@vueuse/router";
import { useUrlSearchParams } from "@vueuse/core";

// --- internal
import {
  useRoutingEngine,
  ReceivedEmailsSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import { ROUTE } from "../../../router/types";

// --- components
import { Layout, UpmSection, UpmSections } from "@upmind-automation/client-vue";
import EmailHistoryListing from "./EmailHistoryListing.vue";

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { isReady, isResolved, currentRoute, meta } = useRoutingEngine();
await isReady();
await isResolved(ROUTE.ACCOUNT_EMAIL_HISTORY);

const { t } = useI18n();

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
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
