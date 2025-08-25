<!-- eslint-disable vue/no-unused-components -->
<template>
  <DropdownMenu
    v-if="meta.isAuthenticated"
    :items="items"
    width="sm"
    :ui-config="{
      dropdownMenu: {
        content: ['mt-4']
      }
    }"
  >
    <template #trigger>
      <slot></slot>
    </template>

    <template #label>
      <div class="flex flex-col items-start break-all" v-if="user">
        <div>{{ user.fullname }}</div>
        <div class="text-sm font-normal opacity-60">
          {{ user.username }}
        </div>
      </div>
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

const { t } = useI18n();

const { user, logout, meta } = useSession();
const items = computed<DropdownMenuItemProps[]>(() => [
  {
    label: t("auth.actions.logout"),
    icon: "logout",
    value: "logout",
    handler: logout
  }
]);
</script>
