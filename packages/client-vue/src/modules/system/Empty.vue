<template>
  <div
    class="flex grow items-center justify-center"
    data-test-key="basket-empty-message"
  >
    <Interstitial
      :close-label="t('action.close')"
      :open="props.open"
      :modal="meta.useModal"
      :title="t('cart.empty_md')"
      :text="t('cart.empty_msg')"
      :animated-icon="{ icon: 'basket-empty', size: 'xl' }"
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
import { Interstitial, Button, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";
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
