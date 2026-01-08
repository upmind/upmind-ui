<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :title="t('auth.logged_out_md')"
      :text="t('text.continue_shopping_desc')"
      :actions="[
        {
          to: props.storefrontRoute,
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
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/headless";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { onMounted } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    InterstitialProps & {
      storefrontRoute: RouteLocationAsRelativeGeneric;
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
const { logout, meta } = useSession();

// --- side effects
onMounted(() => {
  // FORCE: logout if still authenticated
  if (meta.value.isAuthenticated) logout();
});
</script>
