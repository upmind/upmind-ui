<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      :close-label="t('action.close')"
      :open="props.open"
      :modal="props.modal"
      :title="t('auth.logged_out_md')"
      :text="t('text.continue_shopping_desc')"
      :animated-icon="{ icon: 'keys', size: 'xl' }"
    >
      <template #actions>
        <Button
          v-bind="useTestAttrs({ key: 'interstitial-action', value: 0 })"
          as-child
          variant="primary"
          size="lg"
        >
          <RouterLink
            v-if="props.storefrontRoute.to"
            :to="props.storefrontRoute.to"
          >
            {{ t("action.continue_shopping") }}
          </RouterLink>
          <a v-else :href="props.storefrontRoute.href">
            {{ t("action.continue_shopping") }}
          </a>
        </Button>
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { useActiveSession } from "@upmind-automation/headless";
import { Interstitial, Button, useTestAttrs } from "@upmind/ui";
import type { StorefrontRoute } from "../../types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    open?: boolean;
    modal?: boolean;
    storefrontRoute: StorefrontRoute;
  }>(),
  {
    modal: true,
    open: true
  }
);
// -----------------------------------------------------------------------------
const { t } = useI18n();
const session = useActiveSession();
const { isAuthenticated } = session.useMeta();
const { logout } = session.useActions();

// --- side effects
onMounted(() => {
  // FORCE: logout if still authenticated
  if (isAuthenticated.value) logout();
});
</script>
