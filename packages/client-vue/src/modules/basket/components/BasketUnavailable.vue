<template>
  <div v-if="meta.isUnavailable" class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :modal="meta.useModal"
      :title="t('error.basket_unavailable_md')"
      :text="t('error.basket_unavailable_text')"
      :actions="[
        {
          to: props.storefrontRoute,
          variant: 'solid',
          color: 'primary',
          icon: 'arrow-left',
          label: t('action.return_to_shop'),
          size: 'lg'
        }
      ]"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    InterstitialProps & {
      storefrontRoute: RouteLocationAsRelativeGeneric;
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
const { meta: basketMeta } = useBasket();

const meta = computed(() => ({
  isUnavailable: basketMeta.value.isUnavailable,
  useModal: props.modal
}));
</script>
