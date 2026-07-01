<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :title="t('auth.logged_out_md')"
      :text="t('text.continue_shopping_desc')"
      :actions="[
        {
          ...props.storefrontRoute,
          variant: 'solid',
          color: 'primary',
          iconAppend: 'arrow-right',
          label: t('action.continue_shopping')
        }
      ]"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useActiveSession } from "@upmind-automation/headless";
import { Interstitial } from "@upmind-automation/upmind-ui";
import type { StorefrontRoute } from "../../types";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    InterstitialProps & {
      storefrontRoute: StorefrontRoute;
    }
  >(),
  {
    modal: true,
    open: true,

    animatedIcon: () => ({
      icon: "keys",
      trigger: "loop",
      primaryColor: "base-foreground",
      secondaryColor: "tertiary",
      size: "4xl"
    })
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
