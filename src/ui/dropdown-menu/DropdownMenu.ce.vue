<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger">
        <Button
          :variant="props.variant"
          :color="props.color"
          :loading="props.loading"
          :class="cn(styles.dropdownMenu.trigger, props.class)"
          :label="props.label"
          :size="props.size"
          :aria-expanded="open"
        >
          <template #prepend>
            <Avatar
              v-if="props.avatar"
              v-bind="props.avatar"
              size="3xs"
              shape="circle"
              fit="cover"
              aria-hidden="true"
            />
            <Icon
              v-if="props.icon"
              :icon="props.icon"
              shape="circle"
              size="3xs"
              fit="cover"
              aria-hidden="true"
            />
          </template>

          <span
            class="flex flex-col gap-y-1"
            v-if="props.label || props.sublabel || props.tag"
          >
            <span v-if="props?.label" class="truncate leading-none">
              {{ props.label }}
            </span>

            <span v-if="props?.sublabel" class="leading-none opacity-50">
              {{ props.sublabel }}
            </span>

            <span v-if="props?.tag" class="text-center font-bold leading-none">
              {{ props.tag }}
            </span>
          </span>
        </Button>
      </slot>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      :align="align"
      :class="
        cn(
          styles.dropdownMenu.content,
          props.popoverClass ? props.popoverClass : props.class
        )
      "
    >
      <DropdownMenuLabel v-if="props.title || $slots.label" class="border-b">
        <slot name="label">{{ title }}</slot>
      </DropdownMenuLabel>

      <DropdownMenuGroup>
        <template v-for="(item, index) in items" :key="`item-${index}`">
          <DropdownMenuItem
            v-if="!item.hidden"
            :value="item.value"
            :disabled="item.disabled"
            :class="
              cn(
                'group flex cursor-pointer items-center justify-start gap-4',
                styles.dropdownMenu.item,
                item.class,
                props.itemClass
              )
            "
            @click="doAction(item)"
          >
            <Avatar v-if="item.avatar" v-bind="item.avatar" size="3xs" />
            <Icon v-if="item.icon" :icon="item.icon" size="3xs" />
            <span v-if="item.label" class="leading-none">{{ item.label }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./dropdown-menu.config";

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
  // -- styles
  color: "base",
  size: "md",
  width: "md",
  variant: "ghost",
  align: "end",
  // ---
  icon: "navigation-menu-vertical",

  // --- styles
  uiConfig: () => ({ dropdownMenu: {} }),
  class: "",
  popoverClass: "",
  itemClass: "",
});

const meta = computed(() => ({
  color: props.color,
  width: props.width,
  size: props.size,
}));

const open = ref(false);
const processing = ref(false);

// ---

const styles = useStyles(
  ["dropdownMenu"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  dropdownMenu: { trigger: string; content: string; item: string };
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
