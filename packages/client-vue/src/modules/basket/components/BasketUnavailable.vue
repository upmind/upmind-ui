<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :modal="meta.useModal"
      :title="t('error.basket_unavailable_md')"
      :text="t('error.basket_unavailable_text')"
      :actions="[
        {
          variant: 'solid',
          color: 'primary',
          icon: 'arrow-left',
          label: t('action.return_to_shop'),
          size: 'lg',
          handler: handleReturn
        }
      ]"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useBasket, useRoutingEngine } from "@upmind-automation/headless";
import { Interstitial } from "@upmind-automation/upmind-ui";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  animatedIcon: () => ({
    icon: "basket-empty",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl"
  })
});
// -----------------------------------------------------------------------------
const { t } = useI18n();
const { reset } = useBasket();
const { navigateNext } = useRoutingEngine();
const route = useRoute();
const routeMeta = route.meta;

const meta = computed(() => ({
  useModal: props.modal || !!routeMeta.modal
}));

function handleReturn() {
  reset();
  return navigateNext();
}
</script>
