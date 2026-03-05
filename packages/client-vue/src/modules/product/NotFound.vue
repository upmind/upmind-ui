<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      open
      modal
      :title="t('cart.product_not_found_md')"
      :text="t('error.product_not_found')"
      :actions="[
        {
          ...props.storefrontRoute,
          variant: 'solid',
          color: 'primary',
          icon: 'arrow-left',
          label: t('action.continue_shopping')
        }
      ]"
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

// --- internal

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import type { StorefrontRoute } from "../../types";

// -----------------------------------------------------------------------------

const props = defineProps<{
  storefrontRoute: StorefrontRoute;
}>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
</script>
