<template>
  <ContextMenu>
    <ContextMenuTrigger :disabled="props.disabled" :class="props.class">
      <slot name="trigger" />
    </ContextMenuTrigger>

    <ContextMenuContent
      :class="
        cn(
          styles.contextMenu.content,
          props.popoverClass ? props.popoverClass : props.class
        )
      "
      :to="props.to"
    >
      <ContextMenuLabel
        v-if="props.title || $slots.label"
        :class="styles.contextMenu.label"
      >
        <slot name="label">{{ title }}</slot>
      </ContextMenuLabel>

      <ContextMenuGroup :class="styles.contextMenu.group">
        <template
          v-for="(item, index) in items"
          :key="`context-menu-item-${index}`"
        >
          <ContextMenuItem
            v-if="!item.hidden"
            :disabled="item.disabled"
            @select="doAction(item)"
          >
            <slot name="item" v-bind="{ item }">
              <Button
                :class="styles.contextMenu.item"
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
                :dataAttrs="item.dataAttrs"
              />
            </slot>
          </ContextMenuItem>
        </template>
      </ContextMenuGroup>

      <slot />
    </ContextMenuContent>
  </ContextMenu>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Button from "../button/Button.ce.vue";
import config from "./context-menu.config";
import ContextMenu from "./ContextMenu.vue";
import ContextMenuContent from "./ContextMenuContent.vue";
import ContextMenuGroup from "./ContextMenuGroup.vue";
import ContextMenuItem from "./ContextMenuItem.vue";
import ContextMenuLabel from "./ContextMenuLabel.vue";
import ContextMenuTrigger from "./ContextMenuTrigger.vue";
import { cn, useStyles } from "../../utils";
import { isFunction } from "lodash-es";
import type { ContextMenuItemProps, ContextMenuProps } from "./types";

const props = withDefaults(defineProps<ContextMenuProps>(), {
  // --- props
  label: "",
  items: () => [],
  disabled: false,
  // -- styles
  size: "md",
  // --- styles
  uiConfig: () => ({
    contextMenu: {
      content: [],
      item: [],
      label: [],
      group: []
    }
  }),
  class: "",
  popoverClass: ""
});

const meta = computed(() => ({
  size: props.size
}));

const styles = useStyles(["contextMenu"], meta, config, props.uiConfig ?? {});

async function doAction(item: ContextMenuItemProps) {
  if (isFunction(item?.handler)) {
    await item.handler();
  }
}
</script>
