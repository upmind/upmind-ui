<template>
  <UpmAuthLogin
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  >
    <template #default="{ template }">
      <component :is="sessionTemplate(template)" />
    </template>
    <template #loading><UpmLoading /></template>
    <template #summary="summary">
      <UpmSessionSummary v-bind="summary" />
    </template>
  </UpmAuthLogin>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmAuthLogin } from "@upmind-automation/auth";
import { ROUTE } from "~/funnels/types";
import UpmSessionSummary from "~/shell/modules/session/components/SessionSummary.vue";
import UpmLoading from "~/shell/modules/system/Loading.vue";
import { sessionTemplate } from "~/shell/shell";
const { t } = useI18n();

// SEO: Login page
useHead({
  title: t("seo.page_login_title")
});

useSeoMeta({
  description: t("seo.page_login_description")
});

// Schema.org: WebPage for login
useSchemaOrg([
  defineWebPage({
    "@type": "WebPage",
    name: t("seo.page_login_title"),
    description: t("seo.page_login_description")
  })
]);

definePageMeta({
  name: ROUTE.SESSION_LOGIN
});
</script>
