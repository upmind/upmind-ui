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
    icon: "arrow-left",
    label: t("action.continue_shopping")
  }
]);
</script>
