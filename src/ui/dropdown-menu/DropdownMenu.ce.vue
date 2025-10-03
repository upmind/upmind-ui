<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger">
        <Button
          :variant="props.variant"
          :loading="props.loading"
          :class="cn(styles.dropdownMenu.trigger, props.class)"
          :label="props.label"
          :size="props.size"
          :ring="props.ring"
          :icon="props.icon"
          :avatar="props.avatar"
          :aria-expanded="open"
        />
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
      :to="props.to"
    >
      <DropdownMenuLabel
        v-if="props.title || $slots.label"
        :class="styles.dropdownMenu.label"
      >
        <slot name="label">{{ title }}</slot>
      </DropdownMenuLabel>

      <DropdownMenuGroup :class="styles.dropdownMenu.group">
        <template
          v-for="(item, index) in items"
          :key="`dropdown-item-${index}`"
        >
          <Button
            v-if="!item.hidden"
            :class="styles.dropdownMenu.item"
            variant="ghost"
            align="left"
            block
            :size="props.size"
            :value="item.value"
            :disabled="item.disabled"
            @click="doAction(item)"
            :icon="item.icon"
            :label="item.label"
          />
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
import DropdownMenu from "./DropdownMenu.vue";
import DropdownMenuContent from "./DropdownMenuContent.vue";
import DropdownMenuTrigger from "./DropdownMenuTrigger.vue";
import DropdownMenuGroup from "./DropdownMenuGroup.vue";
import DropdownMenuLabel from "./DropdownMenuLabel.vue";

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
  size: "md",
  width: "auto",
  variant: "primary",
  align: "end",
  ring: true,
  // --- styles
  uiConfig: () => ({
    dropdownMenu: {
      trigger: [],
      content: [],
      item: [],
      label: [],
      group: [],
      icon: []
    }
  }),
  class: "",
  popoverClass: "",
  itemClass: ""
});

const meta = computed(() => ({
  width: props.width,
  size: props.size
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
  dropdownMenu: {
    trigger?: string;
    content?: string;
    item?: string;
    label?: string;
    group?: string;
    icon?: string;
  };
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
