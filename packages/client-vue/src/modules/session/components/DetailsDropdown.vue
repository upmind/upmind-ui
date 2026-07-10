<!-- eslint-disable vue/no-unused-components -->
<template>
  <DropdownMenu
    v-if="isAuthenticated"
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
        v-bind="labelTestAttrs"
      >
        <strong class="font-medium">
          {{ isGuestClient ? t("auth.guest") : client.fullName }}
        </strong>
        <span
          v-if="!isGuestClient"
          class="text-md-tight font-normal opacity-60"
        >
          {{ client.username }}
        </span>
      </label>
    </template>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useActiveSession } from "@upmind-automation/headless";
import { DropdownMenu, useTestAttrs } from "@upmind-automation/upmind-ui";
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";

const emit = defineEmits<{
  register: [];
}>();

const { t } = useI18n();
const session = useActiveSession();
const { isAuthenticated, isGuestClient } = session.useMeta();
const { activeUser: client } = session.useContext();
const { logout } = session.useActions();

const labelTestAttrs = useTestAttrs({ key: "dropdown-account-label" });

const items = computed<DropdownMenuItemProps[]>(() => {
  const menuItems: DropdownMenuItemProps[] = [];

  if (isGuestClient.value) {
    menuItems.push({
      label: t("action.register"),
      icon: "user-plus-01",
      value: "register",
      handler: () => emit("register"),
      dataAttrs: { "data-test-key": "button-register" }
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
