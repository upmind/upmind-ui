<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      :close-label="t('action.close')"
      :open="props.open"
      :modal="meta.useModal"
      :title="t('error.basket_unavailable_md')"
      :text="t('error.basket_unavailable_text')"
      :animated-icon="{ icon: 'basket-empty', size: 'xl' }"
    >
      <template #actions>
        <Button
          v-bind="useTestAttrs({ key: 'interstitial-action', value: 0 })"
          variant="primary"
          size="lg"
          @click="handleReturn"
        >
          <Icon icon="arrow-left" />
          {{ t("action.return_to_shop") }}
        </Button>
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
import { Interstitial, Button, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useBasket, useRoutingEngine } from "@upmind-automation/headless";
import { Icon } from "../../../components/icon";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    open?: boolean;
    modal?: boolean;
  }>(),
  {
    open: true,
    modal: true
  }
);
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
