<template>
  <DropdownMenu
    v-if="meta.isAuthenticated || meta.isProcessing"
    :items="items"
    :size="props.size"
    :placement="props.placement"
    :disabled="meta.isProcessing"
    :loading="meta.isProcessing"
    :prepend-avatar="client?.avatar"
    :label="client?.display"
    :toggle="null"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { DropdownMenu } from "@upmind-automation/upmind-ui";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- types
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    size: "sm" | "md" | "lg";
    placement: string;
  }>(),
  {}
);

const { t } = useI18n();

const { meta, client, logout } = useSession();

const items = computed((): DropdownMenuItemProps[] => {
  if (!meta.value.isAuthenticated) return [];

  return [
    {
      label: t("action.logout"),
      icon: "logout",
      value: "logout",
      handler: logout
    }
  ];
});
</script>
