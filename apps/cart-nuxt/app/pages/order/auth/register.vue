<template>
  <UpmSessionRegister
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmSessionRegister } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Registration page
useHead({
  title: t("seo.page_register_title")
});

useSeoMeta({
  description: t("seo.page_register_description")
});

// Schema.org: WebPage for registration
useSchemaOrg([
  defineWebPage({
    "@type": "WebPage",
    name: t("seo.page_register_title"),
    description: t("seo.page_register_description")
  })
]);

definePageMeta({
  name: ROUTE.SESSION_REGISTER
});
</script>
