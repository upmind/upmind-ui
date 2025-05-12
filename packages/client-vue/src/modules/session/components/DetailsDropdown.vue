<!-- eslint-disable vue/no-unused-components -->
<template>
  <DropdownMenu :items="items" itemClass="!px-5 !py-4" popoverClass="mt-8">
    <template #trigger>
      <slot />
    </template>

    <template #label>
      <div class="flex flex-col items-start break-all px-3 py-2">
        <div>{{ user.fullname }}</div>
        <div class="text-sm font-normal opacity-60">
          {{ user.email }}
        </div>
      </div>
    </template>
  </DropdownMenu>
</template>

<script setup lang="ts">
// --- internal
import { useSession } from "@upmind-automation/headless-vue";

// --- components
import { DropdownMenu } from "@upmind-automation/upmind-ui";

// --- types
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { user, logout } = useSession();
const items: DropdownMenuItemProps[] = [
  {
    label: t("session.account_dropdown.log_out"),
    icon: "logout",
    value: "logout",
    handler: logout,
  },
];
</script>
