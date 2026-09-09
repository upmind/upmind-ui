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
// Where the package's hand-back lands a visitor it has no return target for.
// Amendment 1 change 3 keeps the shell app-owned, so the end-state screen is
// this app's, not the package's: the package only names the path.
import { Interstitial } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { AUTH_QUERY } from "@upmind-automation/auth";
import { landingRootVariants } from "./variants";

const { t } = useI18n();
const route = useRoute();

// A refused return target is NOT the same event as a missing one, and the
// visitor is the only one who can tell us which address they meant.
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
