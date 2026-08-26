<template>
  <DropdownMenu v-if="isAuthenticated" :items="items" class="mt-4 max-w-60">
    <template #trigger>
      <slot />
    </template>

    <template v-if="client" #label>
      <label
        class="flex flex-col items-start text-base break-all not-italic"
        data-test-key="dropdown-account-label"
      >
        <strong class="font-medium">
          {{ isGuestClient ? t("auth.guest") : client.fullName }}
        </strong>
        <span v-if="!isGuestClient" class="text-muted text-base font-normal">
          {{ client.username }}
        </span>
      </label>
    </template>

    <template #item="{ item }">
      <Icon :icon="item.icon" />
      {{ item.label }}
    </template>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { DropdownMenu } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useActiveSession } from "@upmind-automation/headless";
import { Icon } from "../../../components/icon";
import type { MenuItem } from "@upmind/ui";

interface SessionMenuItem extends MenuItem {
  icon: string;
}

const emit = defineEmits<{
  register: [];
}>();

const { t } = useI18n();
const session = useActiveSession();
const { isAuthenticated, isGuestClient } = session.useMeta();
const { activeUser: client } = session.useContext();
const { logout } = session.useActions();

const items = computed<SessionMenuItem[]>(() => {
  const menuItems: SessionMenuItem[] = [];

  if (isGuestClient.value) {
    menuItems.push({
      label: t("action.register"),
      icon: "user-plus-01",
      value: "register",
      onSelect: () => emit("register"),
      dataAttrs: { "data-test-key": "button-register" }
    });
  }

  menuItems.push({
    label: t("action.logout"),
    icon: "log-out-01",
    value: "logout",
    onSelect: logout
  });

  return menuItems;
});
</script>
