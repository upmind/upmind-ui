<template>
  <popover-root v-model:open="open">
    <popover-trigger>
      <uw-button
        variant="outline"
        color="base"
        role="combobox"
        :aria-expanded="open"
        :class="styles.combobox.button"
      >
        <span class="flex items-center truncate">
          {{ selectedItem?.label || label }}
        </span>
      </uw-button>
    </popover-trigger>
    <popover-portal>
      <popover-content :class="styles.combobox.content">
        <combobox-root
          :open="open"
          :model-value="modelValue"
          :class="styles.combobox.root"
        >
          <div :class="styles.combobox.command.wrapper" cmdk-input-wrapper>
            <combobox-input
              auto-focus
              :class="styles.combobox.command.root"
              :placeholder="searchPlaceholder"
            />
          </div>
          <combobox-empty :class="styles.combobox.empty">
            {{ emptyMessage }}
          </combobox-empty>
          <combobox-content :class="styles.combobox.list">
            <div role="presentation">
              <combobox-group :class="styles.combobox.group">
                <combobox-label v-if="heading" :class="styles.combobox.label">
                  {{ heading }}
                </combobox-label>
                <slot></slot>
              </combobox-group>
            </div>
          </combobox-content>
        </combobox-root>
      </popover-content>
    </popover-portal>
  </popover-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs, ref, provide, watch, toRef } from "vue";
import {
  PopoverTrigger,
  PopoverRoot,
  PopoverContent,
  PopoverPortal,
  ComboboxRoot,
  ComboboxInput,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxContent,
  ComboboxItem,
} from "radix-vue";

// --- internal
import config from "./combobox.config";

// --- components
import { UwButton } from "../button";

// --- utils
import { useStyles } from "../../utils";

// --- types
import { type ComboboxConfig } from "./types";

export default defineComponent({
  name: "UwCombobox",
  components: {
    UwButton,
    ComboboxRoot,
    ComboboxInput,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxEmpty,
    ComboboxContent,
    ComboboxItem,
    PopoverRoot,
    PopoverContent,
    PopoverTrigger,
    PopoverPortal,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    width: {
      type: String as ComboboxConfig["width"],
      default: "md",
    },
    color: {
      type: String as ComboboxConfig["color"],
      default: "base",
    },
    label: {
      type: String,
      default: "Select an item",
    },
    searchPlaceholder: {
      type: String,
      default: "Search",
    },
    emptyMessage: {
      type: String,
      default: "No results",
    },
    upwindConfig: {
      type: Object,
      default: null,
    },
    heading: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const open = ref(false);
    const selectedItem = ref(null);

    const styles = useStyles(
      ["combobox", "combobox.icons", "combobox.command"],
      toRefs(props),
      config,
      props.upwindConfig
    );

    const onSelect = (value: string, label: string, icon: string) => {
      emit("update:modelValue", value);
      selectedItem.value = { label, value, icon };
      open.value = false;
    };

    provide("comboboxContext", {
      onSelect,
      modelValue: toRef(props, "modelValue"),
      color: toRef(props, "color"),
    });

    return {
      open,
      styles,
      onSelect,
      selectedItem,
    };
  },
});
</script>

<style src="@/assets/main.css" />
