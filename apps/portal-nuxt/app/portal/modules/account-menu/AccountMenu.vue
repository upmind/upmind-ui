<template>
  <DropdownMenu :items="menuItems" :label="props.heading">
    <template #trigger>
      <PortalButton
        variant="ghost"
        icon-only
        :aria-label="props.label"
        v-bind="useTestAttrs({ key: 'portal-account-menu' })"
      >
        <!-- `sm` (32px): the library's md default overfilled the topbar. -->
        <Avatar size="sm" :src="props.imageSrc" :alt="props.label">
          {{ props.monogram }}
        </Avatar>
      </PortalButton>
    </template>
  </DropdownMenu>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/account-menu/AccountMenu
 * @description The `account-menu` module — legacy's profile-dropdown, over
 * the composed DropdownMenu. Every pick emits its value through the action
 * seam; destinations ride the `navigate:` verb (mock/actions.ts).
 */
import {
  Avatar,
  Button as PortalButton,
  DropdownMenu,
  useTestAttrs
} from "@upmind/ui";
import { computed } from "vue";
import { map } from "lodash-es";
import type { AccountMenuModuleEmits, AccountMenuModuleProps } from "./types";
import type { MenuItem } from "@upmind/ui";

defineOptions({ name: "PortalAccountMenu" });

const props = defineProps<AccountMenuModuleProps>();
const emits = defineEmits<AccountMenuModuleEmits>();

const menuItems = computed<MenuItem[]>(() =>
  map(props.items, item => ({
    label: item.label,
    value: item.value,
    onSelect: () => emits("select", item.value)
  }))
);
</script>
