<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger">
        <Button
          :variant="variant"
          :color="color"
          :loading="loading"
          :class="props.class"
          :label="label"
          :size="size"
          :aria-expanded="open"
        >
          <template #prepend>
            <Avatar
              v-if="avatar"
              v-bind="avatar"
              size="3xs"
              shape="circle"
              fit="cover"
              aria-hidden="true"
            />
            <Icon
              v-if="icon"
              :icon="icon"
              shape="circle"
              size="3xs"
              fit="cover"
              aria-hidden="true"
            />
          </template>
        </Button>
      </slot>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      :align="align"
      :class="
        cn(
          variants.dropdownMenu.content,
          props.popoverClass ? props.popoverClass : props.class
        )
      "
    >
      <DropdownMenuLabel v-if="props.title">{{ title }}</DropdownMenuLabel>

      <DropdownMenuGroup>
        <template v-for="(item, index) in items" :key="`item-${index}`">
          <DropdownMenuItem
            :value="item.value"
            :class="
              cn(
                'group flex cursor-pointer items-center justify-start gap-4',
                variants.dropdownMenu.item,
                item.class
              )
            "
            @click="doAction(item)"
          >
            <Avatar v-if="item.avatar" v-bind="item.avatar" size="3xs" />
            <Icon v-if="item.icon" :icon="item.icon" size="3xs" />
            <span>{{ item.label }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./dropdownMenu.config";

// --- components
import Button from "../button/Button.ce.vue";
import Avatar from "../avatar/Avatar.ce.vue";
import Icon from "../icon/Icon.ce.vue";

import DropdownMenu from "./DropdownMenu.vue";
import DropdownMenuContent from "./DropdownMenuContent.vue";
import DropdownMenuTrigger from "./DropdownMenuTrigger.vue";
import DropdownMenuGroup from "./DropdownMenuGroup.vue";
import DropdownMenuItem from "./DropdownMenuItem.vue";
import DropdownMenuLabel from "./DropdownMenuLabel.vue";
// import DropdownMenuSeparator from "./DropdownMenuSeparator.vue";

// import DropdownMenuShortcut from "./DropdownMenuShortcut.vue";
// import DropdownMenuSub from "./DropdownMenuSub.vue";
// import DropdownMenuSubContent from "./DropdownMenuSubContent.vue";
// import DropdownMenuSubTrigger from "./DropdownMenuSubTrigger.vue";

// --- utils
import { isFunction } from "lodash-es";

// --- types
import type { DropdownMenuProps, DropdownMenuItemProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  // --- props
  label: "",
  items: () => [],
  loading: false,
  // -- variants
  color: "base",
  size: "md",
  variant: "ghost",
  align: "end",
  // ---
  icon: "navigation-menu-vertical",

  // --- styles
  upwindConfig: () => ({ dropdownMenu: {} }),
  class: "",
  popoverClass: "",
});

const meta = computed(() => ({
  color: props.color,
}));

const open = ref(false);
const processing = ref(false);

// ---

const variants = useStyles(
  ["dropdownMenu"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  dropdownMenu: { content: string; item: string };
}>;
// ---

async function doAction(item: DropdownMenuItemProps) {
  if (isFunction(item?.handler)) {
    processing.value = true;
    await item.handler();
    processing.value = false;
    open.value = false;
  }
}
</script>
