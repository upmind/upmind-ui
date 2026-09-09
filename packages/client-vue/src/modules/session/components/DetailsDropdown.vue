<template>
  <DropdownMenu
    v-if="isAuthenticated"
    :items="items"
    class="max-w-72 min-w-56"
    :ui="{ label: 'border-stroke mb-1 border-b pt-2 pb-2.5' }"
  >
    <template #trigger>
      <slot />
    </template>

    <!-- the label part is a faint caption, so each line states its own weight
         and colour rather than inheriting one meant for section headings -->
    <template v-if="client" #label>
      <div data-test-key="dropdown-account-label">
        <p class="text-display truncate text-sm font-medium">
          {{ isGuestClient ? t("auth.guest") : client.fullName }}
        </p>
        <p v-if="!isGuestClient" class="text-muted truncate text-xs">
          {{ client.username }}
        </p>
      </div>
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
