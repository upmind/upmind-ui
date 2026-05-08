<!-- eslint-disable vue/no-unused-components -->
<template>
  <DropdownMenu
    v-if="meta.isAuthenticated"
    :items="items"
    width="md"
    size="lg"
    :ui-config="{
      dropdownMenu: {
        content: ['mt-4']
      }
    }"
  >
    <template #trigger>
      <slot />
    </template>

    <template #label>
      <label
        class="text-md-tight flex flex-col items-start break-all not-italic"
        v-if="client"
      >
        <strong class="font-medium">
          {{ meta.isGuestClient ? t("auth.guest") : client.fullName }}
        </strong>
        <span
          v-if="!meta.isGuestClient"
          class="text-md-tight font-normal opacity-60"
        >
          {{ client.username }}
        </span>
      </label>
    </template>
  </DropdownMenu>
</template>

<script setup lang="ts">
// --- internal
import { computed } from "vue";
import { useSession } from "@upmind-automation/headless";

// --- components
import { DropdownMenu } from "@upmind-automation/upmind-ui";

// --- types
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";

import { useI18n } from "vue-i18n";

const emit = defineEmits<{
  register: [];
}>();

const { t } = useI18n();
const { client, logout, meta } = useSession();

const items = computed<DropdownMenuItemProps[]>(() => {
  const menuItems: DropdownMenuItemProps[] = [];

  if (meta.value.isGuestClient) {
    menuItems.push({
      label: t("action.register"),
      icon: "user-plus-01",
      value: "register",
      handler: () => emit("register")
    });
  }

  menuItems.push({
    label: t("action.logout"),
    icon: "log-out-01",
    value: "logout",
    handler: logout
  });

  return menuItems;
});
</script>
