<template>
  <Alert
    color="error"
    icon="alert"
    icon-size="xs"
    variant="tonal"
    class="p-2 px-3"
  >
    <template #title>
      <span class="hidden md:inline">{{ t("cart.item.md.invalid") }}</span>
      <span class="md:hidden">{{ t("cart.item.base.invalid") }}</span>
    </template>
    <template #action>
      <router-link :to="editLink">
        <Button variant="link" size="sm" color="error" class="-mr-1 underline">
          <span class="hidden md:inline">{{
            t("cart.item.md.invalidAction")
          }}</span>
          <span class="md:hidden">{{ t("cart.item.base.invalidAction") }}</span>
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
import { Alert, Button, Icon } from "@upmind-automation/upwind";

const { t } = useI18n();

const props = defineProps<{
  id: string;
}>();

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});
</script>
