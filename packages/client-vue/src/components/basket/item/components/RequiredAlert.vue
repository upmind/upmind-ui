<template>
  <Alert
    :title="title"
    color="error"
    icon="alert"
    :action="t('cart.item.invalidAction')"
    icon-size="xs"
    variant="tonal"
    class="p-2 px-3"
  >
    <template #action>
      <!-- TODO: Using -m classes again to get correct positioning, we shouldn't need this -->
      <router-link :to="editLink">
        <Button
          variant="link"
          size="sm"
          :label="buttonLabel"
          color="error"
          class="-mr-1 underline"
        >
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
  mobile?: boolean;
}>();

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});

const title = computed(() => {
  return props.mobile ? t("cart.item.invalidMinified") : t("cart.item.invalid");
});

const buttonLabel = computed(() => {
  return props.mobile
    ? t("cart.item.invalidActionMinified")
    : t("cart.item.invalidAction");
});
</script>
