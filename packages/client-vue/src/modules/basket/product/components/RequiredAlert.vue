<template>
  <Alert color="error" icon="alert">
    <template #title>
      <h5 class="m-0 hidden font-normal md:inline">
        {{ t("cart.basket_product_missing_data_help") }}
      </h5>
      <h5 class="m-0 font-normal md:hidden">
        {{ t("cart.basket_product_missing_data") }}
      </h5>
    </template>
    <template #action>
      <Button
        :as="RouterLink"
        :to="editLink"
        variant="link"
        size="sm"
        color="error"
        icon-append="arrow-right"
      >
        <p class="m-0 hidden md:inline">
          {{ t("action.add_missing_data") }}
        </p>
        <p class="m-0 md:hidden">{{ t("action.fix") }}</p>
      </Button>
    </template>
  </Alert>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { RouterLink } from "vue-router";

// --- components
import { Alert, Button, Icon } from "@upmind-automation/upmind-ui";

const { t } = useI18n();

const props = defineProps<{
  id: string;
}>();

const editLink = computed(() => {
  return {
    name: "product.edit",
    params: {
      bpid: props.id
    }
  };
});
</script>
