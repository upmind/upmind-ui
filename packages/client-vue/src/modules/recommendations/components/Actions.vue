<template>
  <component
    :is="isMobile ? 'section' : Card"
    :class="styles.recommendation.actions.root"
    size="sm"
  >
    <p :class="styles.recommendation.actions.label">
      {{ t("cart.basket_items", { count: count ?? 0 }) }}
    </p>

    <Button
      @click="$emit('skip')"
      :label="t('action.skip')"
      color="primary"
      size="lg"
      :class="styles.recommendation.actions.button"
      iconAppend="arrow-right"
    />
  </component>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import {
  Button,
  Card,
  isMobile,
  useStyles
} from "@upmind-automation/upmind-ui";

// --- internal
import config from "../recommendations.config";
import { useBasket } from "@upmind-automation/headless";

defineEmits<{
  skip: [];
}>();

const { t } = useI18n();
const { count } = useBasket();
const styles = useStyles(["recommendation.actions"], {}, config);
</script>
