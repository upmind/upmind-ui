<template>
  <UpmAuthRegister
    :templates="SESSION_TEMPLATES"
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  >
    <template #loading><UpmLoading /></template>
    <template #summary="summary">
      <SessionSummary v-bind="summary" />
    </template>
    <template #guest-checkout="offer">
      <UpmGuestCheckoutOffer v-bind="offer" />
    </template>
  </UpmAuthRegister>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmAuthRegister } from "@upmind-automation/auth";
import { UpmGuestCheckoutOffer } from "@upmind-automation/basket";
import { ROUTE } from "../../../funnels/types";
import SessionSummary from "../../../shell/modules/session/components/SessionSummary.vue";
import { SESSION_TEMPLATES } from "../../../shell/modules/session/shell";
import UpmLoading from "../../../shell/modules/system/Loading.vue";

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
