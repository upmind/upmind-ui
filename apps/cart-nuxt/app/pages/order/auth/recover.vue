<template>
  <UpmAuthRecoverPassword
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  >
    <template #default="{ template }">
      <component :is="sessionTemplate(template)" />
    </template>
    <template #summary="summary">
      <SessionSummary v-bind="summary" />
    </template>
  </UpmAuthRecoverPassword>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmAuthRecoverPassword } from "@upmind-automation/auth";
import { ROUTE } from "../../../funnels/types";
import SessionSummary from "../../../shell/modules/session/components/SessionSummary.vue";
import { sessionTemplate } from "../../../shell/modules/session/shell";

const { t } = useI18n();

// SEO: Password recovery page
useHead({
  title: t("seo.page_recover_title")
});

useSeoMeta({
  description: t("seo.page_recover_description")
});

// Schema.org: WebPage for password recovery
useSchemaOrg([
  defineWebPage({
    "@type": "WebPage",
    name: t("seo.page_recover_title"),
    description: t("seo.page_recover_description")
  })
]);

definePageMeta({
  name: ROUTE.SESSION_RECOVER_PASSWORD
});
</script>
