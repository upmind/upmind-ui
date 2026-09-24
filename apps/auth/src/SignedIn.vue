<template>
  <div :class="landingRootVariants()">
    <Interstitial
      open
      :modal="false"
      :close-label="t('action.close')"
      :animated-icon="{ icon: meta.icon, size: 'xl' }"
      :title="t(meta.title)"
      :text="t(meta.text)"
      :data-attrs="{ 'data-test-key': 'auth-landing' }"
    />
  </div>
</template>

<script lang="ts" setup>
import { Interstitial } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { AUTH_QUERY } from "@upmind-automation/auth";
import { landingRootVariants } from "./variants";

const { t } = useI18n();
const route = useRoute();

const meta = computed(() => {
  if (route.query[AUTH_QUERY.RETURN_REFUSED])
    return {
      icon: "error",
      title: "auth.return_refused_title",
      text: "auth.return_refused_desc"
    };

  return {
    icon: "keys",
    title: "auth.signed_in_title",
    text: "auth.signed_in_desc"
  };
});
</script>
