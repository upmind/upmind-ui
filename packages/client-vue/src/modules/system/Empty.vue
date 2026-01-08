<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :modal="meta.useModal"
      :title="t('cart.empty_md')"
      :text="t('cart.empty_msg')"
      :actions="actions"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { computed } from "vue";
import { has } from "lodash-es";

// --- internal
import { useBrand } from "@upmind-automation/headless";

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
    open: true,
    modal: true,
    animatedIcon: () => ({
      icon: "basket-empty",
      trigger: "loop",
      primaryColor: "base-foreground",
      secondaryColor: "tertiary",
      size: "4xl"
    })
  }
);
// -----------------------------------------------------------------------------
const { t } = useI18n();
const route = useRoute();
const routeMeta = route.meta;
const { storefrontRoute: brandStorefrontRoute } = useBrand();

const meta = computed(() => ({
  useModal: props.modal || routeMeta.modal !== false
}));

const actions = computed((): InterstitialActionProps[] => {
  const route = brandStorefrontRoute.value || props.storefrontRoute;
  const hasHref = has(route, "href");

  const action: any = {
    variant: "solid",
    color: "primary",
    iconAppend: "arrow-right",
    label: t("action.continue_shopping"),
    size: "lg"
  };

  if (hasHref) {
    action.href = (route as { href: string }).href;
  } else if (route) {
    action.to = route as RouteLocationAsRelativeGeneric;
  }

  return [action];
});
</script>
