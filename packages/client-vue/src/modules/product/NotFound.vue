<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      :close-label="t('action.close')"
      :open="props.open"
      :modal="meta.useModal"
      :title="t('cart.product_not_found_md')"
      :text="t('error.product_not_found')"
      :animated-icon="{ icon: 'basket', size: 'xl' }"
    >
      <template #actions>
        <Button
          v-bind="useTestAttrs({ key: 'interstitial-action', value: 0 })"
          as-child
          variant="primary"
          size="lg"
        >
          <RouterLink
            v-if="props.storefrontRoute.to"
            :to="props.storefrontRoute.to"
          >
            {{ t("action.continue_shopping") }}
            <Icon icon="arrow-right" />
          </RouterLink>
          <a v-else :href="props.storefrontRoute.href">
            {{ t("action.continue_shopping") }}
            <Icon icon="arrow-right" />
          </a>
        </Button>
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";
import { Interstitial, Button, useTestAttrs } from "@upmind/ui";
import { Icon } from "../../components/icon";
import type { StorefrontRoute } from "../../types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    open?: boolean;
    modal?: boolean;
    storefrontRoute: StorefrontRoute;
  }>(),
  {
    open: true,
    modal: true
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
