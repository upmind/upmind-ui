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
      <slot />
    </template>

    <template #label>
      <label
        class="flex flex-col items-start text-sm/tight break-all not-italic"
        v-if="user"
      >
        <strong class="font-medium">{{ user.fullname }}</strong>
        <span class="text-sm/tight font-normal opacity-60">
          {{ user.username }}
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
