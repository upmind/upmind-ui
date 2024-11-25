<template>
  <Alert
    :title="t('cart.item.invalid')"
    color="error"
    icon="alert"
    :border="false"
    :action="t('cart.item.invalidAction')"
    icon-size="xs"
    variant="outline"
  >
    <template #action>
      <!-- TODO: Using -m classes again to get correct positioning, we shouldn't need this -->
      <router-link :to="editLink">
        <Button
          variant="link"
          size="sm"
          :label="t('cart.item.invalidAction')"
          color="error"
          class="-mr-1"
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
