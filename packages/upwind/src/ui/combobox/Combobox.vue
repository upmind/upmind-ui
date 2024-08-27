<template>
  <UwPopover v-model:open="open">
    <UwPopoverTrigger as-child>
      <Button
        variant="outline"
        color="base"
        role="combobox"
        :aria-expanded="open"
        :class="styles.combobox.button"
      >
        <span class="flex items-center truncate">
          <upw-icon
            v-if="selectedItem"
            :icon="selectedItem?.icon"
            :class="styles.combobox.icons.buttonItem"
            aria-hidden="true"
          />
          {{ selectedItem?.label || label }}
        </span>
        <upw-icon
          :class="styles.combobox.icons.arrowUpDown"
          icon="arrow-up-down"
          aria-hidden="true"
        />
      </Button>
    </UwPopoverTrigger>
    <UwPopoverContent :class="styles.combobox.content">
      <UwCommand>
        <UwCommandInput
          :class="styles.combobox.input"
          :placeholder="searchPlaceholder"
        />
        <UwCommandEmpty>{{ emptyMessage }}</UwCommandEmpty>
        <UwCommandList>
          <UwCommandGroup>
            <slot></slot>
          </UwCommandGroup>
        </UwCommandList>
      </UwCommand>
    </UwPopoverContent>
  </UwPopover>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs, ref, provide, watch, toRef } from "vue";

// --- internal
import config from "./combobox.config";

// --- components
import Button from "../button/Button.vue";
import {
  UwCommand,
  UwCommandEmpty,
  UwCommandGroup,
  UwCommandInput,
  UwCommandList,
} from "../command";
import { UwPopover, UwPopoverContent, UwPopoverTrigger } from "../popover";
import UpwIcon from "../../icon/Icon.vue";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import { type ComboboxConfig } from ".";

export default defineComponent({
  components: {
    UpwIcon,
    Button,
    UwCommand,
    UwCommandEmpty,
    UwCommandGroup,
    UwCommandInput,
    UwCommandList,
    UwPopover,
    UwPopoverContent,
    UwPopoverTrigger,
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
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const open = ref(false);
    const selectedItem = ref(null);

    const styles = useStyles(
      ["combobox", "combobox.icons"],
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
