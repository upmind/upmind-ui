<template>
  <Auth :actor="actor" :flow="AuthFlowTypes.REGISTER" fresh @resolve="done" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { AuthFlowTypes } from "@upmind-automation/headless";
import Auth from "./-Auth.vue";
import { useActorScope } from "~/composables/scope";
import { ROUTE } from "~/funnels/types";

definePageMeta({
  name: ROUTE.SESSION_REGISTER
});

const router = useRouter();
const { t } = useI18n();
const actor = useActorScope();

useHead({
  title: t("seo.page_register_title")
});

useSeoMeta({
  description: t("seo.page_register_description")
});

function done(): void {
  router.replace({ name: ROUTE.HOME });
}
</script>
