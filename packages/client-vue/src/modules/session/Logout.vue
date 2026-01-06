<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :title="t('auth.logged_out_md')"
      :text="t('text.continue_shopping_desc')"
      :actions="actions"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed, onMounted } from "vue";
import { has } from "lodash-es";

// --- internal
import { useSession } from "@upmind-automation/headless";

// -- components
import {
  Interstitial,
  type InterstitialActionProps
} from "@upmind-automation/upmind-ui";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    InterstitialProps & {
      storefrontRoute?:
        | RouteLocationAsRelativeGeneric
        | { href: string }
        | null;
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

const actions = computed((): InterstitialActionProps[] => [
  {
    ...(has(props.storefrontRoute, "href")
      ? { href: (props.storefrontRoute as { href: string }).href }
      : {
          to: props.storefrontRoute as
            | RouteLocationAsRelativeGeneric
            | undefined
        }),
    variant: "solid",
    color: "primary",
    iconAppend: "arrow-right",
    label: t("action.continue_shopping")
  }
]);

// --- side effects
onMounted(() => {
  // FORCE: logout if still authenticated
  if (meta.value.isAuthenticated) logout();
});
</script>
