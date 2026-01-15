<template>
  <UpmSessionRegister
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
import { UpmSessionRegister } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Registration page
useHead({
  title: t("seo.page_register_title")
});

useSeoMeta({
  description: t("seo.page_register_description")
});

definePageMeta({
  name: ROUTE.SESSION_REGISTER
});
</script>
