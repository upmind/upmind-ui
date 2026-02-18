<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger">
        <Button
          :variant="props.variant"
          :loading="props.loading"
          :class="props.class"
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
          <DropdownMenuItem
            v-if="!item.hidden"
            :disabled="item.disabled"
            @select="doAction(item)"
          >
            <slot name="item" v-bind="{ item }">
              <Button
                :class="styles.dropdownMenu.item"
                variant="ghost"
                align="left"
                block
                :size="props.size"
                :value="item.value"
                :disabled="item.disabled"
                :icon="item.icon"
                :avatar="item.avatar"
                :label="item.label"
                :ring="false"
              />
            </slot>
          </DropdownMenuItem>
        </template>
      </DropdownMenuGroup>

      <slot />
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import Button from "../button/Button.ce.vue";
import config from "./dropdown-menu.config";
import DropdownMenu from "./DropdownMenu.vue";
import DropdownMenuContent from "./DropdownMenuContent.vue";
import DropdownMenuGroup from "./DropdownMenuGroup.vue";
import DropdownMenuItem from "./DropdownMenuItem.vue";
import DropdownMenuLabel from "./DropdownMenuLabel.vue";
import DropdownMenuTrigger from "./DropdownMenuTrigger.vue";
import { cn, useStyles } from "../../utils";
import { isFunction } from "lodash-es";
import type { DropdownMenuProps, DropdownMenuItemProps } from "./types";

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  // --- props
  label: "",
  items: () => [],
  loading: false,
  // -- styles
  size: "md",
  width: "auto",
  variant: "solid",
  color: "primary",
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

const styles = useStyles(["dropdownMenu"], meta, config, props.uiConfig ?? {});

async function doAction(item: DropdownMenuItemProps) {
  if (isFunction(item?.handler)) {
    processing.value = true;
    await item.handler();
    processing.value = false;
    open.value = false;
  }
}
</script>
