<template>
  <UpmSessionRecoverPassword
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmSessionRecoverPassword } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
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
