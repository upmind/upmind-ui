<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      open
      modal
      :title="t('cart.product_not_found_md')"
      :text="t('error.product_not_found')"
      :actions="actions"
      :animatedIcon="{
        icon: 'basket',
        delay: 5000,
        primaryColor: 'primary',
        secondaryColor: 'accent',
        size: '4xl'
      }"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { has } from "lodash-es";

// --- internal
import { useBrand } from "@upmind-automation/headless";

// -- components
import {
  Interstitial,
  type InterstitialActionProps
} from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  storefrontRoute?: RouteLocationAsRelativeGeneric | { href: string } | null;
}>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { storefrontRoute: brandStorefrontRoute } = useBrand();

const actions = computed((): InterstitialActionProps[] => {
  const route = brandStorefrontRoute.value || props.storefrontRoute;
  const hasHref = has(route, "href");

  const action: any = {
    variant: "solid",
    color: "primary",
    icon: "arrow-left",
    label: t("action.continue_shopping")
  };

  if (hasHref) {
    action.href = (route as { href: string }).href;
  } else if (route) {
    action.to = route as RouteLocationAsRelativeGeneric;
  }

  return [action];
});
</script>
