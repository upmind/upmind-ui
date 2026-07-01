<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :modal="meta.useModal"
      :title="t('cart.product_not_found_md')"
      :text="t('error.product_not_found')"
      :actions="[
        {
          ...props.storefrontRoute,
          variant: 'solid',
          color: 'primary',
          iconAppend: 'arrow-right',
          label: t('action.continue_shopping'),
          size: 'lg'
        }
      ]"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
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
    open: true,
    modal: true,
    animatedIcon: () => ({
      icon: "basket",
      delay: 5000,
      primaryColor: "primary",
      secondaryColor: "accent",
      size: "4xl"
    })
  }
);
// -----------------------------------------------------------------------------
const { t } = useI18n();
const route = useRoute();
const routeMeta = route.meta;

const meta = computed(() => ({
  useModal: props.modal || !!routeMeta.modal
}));
</script>
