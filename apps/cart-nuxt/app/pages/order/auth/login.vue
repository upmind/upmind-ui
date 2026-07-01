<template>
  <UpmSessionLogin
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmSessionLogin } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

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
