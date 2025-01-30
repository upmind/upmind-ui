<template>
  <Alert
    color="error"
    icon="alert"
    icon-size="xs"
    variant="tonal"
    class="p-2 px-3"
  >
    <template #title>
      <h5 class="m-0 hidden md:inline">{{ t("cart.item.md.invalid") }}</h5>
      <h5 class="m-0 md:hidden">{{ t("cart.item.base.invalid") }}</h5>
    </template>
    <template #action>
      <router-link :to="editLink">
        <Button variant="link" size="sm" color="error" class="-mr-1 underline">
          <p class="m-0 hidden md:inline">
            {{ t("cart.item.md.invalidAction") }}
          </p>
          <p class="m-0 md:hidden">{{ t("cart.item.base.invalidAction") }}</p>
          <template #append>
            <Icon icon="chevron-right" size="xs" class="-ml-1.5" />
          </template>
        </Button>
      </router-link>
    </template>
  </Alert>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

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
      bpid: props.id,
    },
  };
});
</script>
