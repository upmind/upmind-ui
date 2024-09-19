<template>
  <link rel="stylesheet" :href="stylesheet" />
  <combobox-item
    :value="value"
    @select="handleSelect"
    :class="styles.combobox.item"
  >
    <u-avatar
      v-if="icon"
      :icon="icon"
      size="sm"
      shape="circle"
      fit="cover"
      :class="styles.combobox.icons.listItem"
      aria-hidden="true"
    />
    {{ label }}
    <div :class="styles.combobox.icons.checkItem">
      <u-icon v-if="isSelected" icon="check" size="xxs" aria-hidden="true" />
    </div>
  </combobox-item>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal

import { useStyles, stylesheet } from "../../utils";
import config from "./combobox.config";

// --- components
import { ComboboxItem } from "radix-vue";
import UAvatar from "../avatar/Avatar.ce.vue";
import UIcon from "../icon/Icon.ce.vue";

// --- utils

export default defineComponent({
  name: "UwComboboxItem",
  components: {
    ComboboxItem,
    UAvatar,
    UIcon,
  },

  props: {
    value: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "base",
    },
    isSelected: {
      type: Boolean,
      required: true,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },

  emits: ["select"],

  setup(props, { emit }) {
    const styles = useStyles(
      ["combobox", "combobox.icons"],
      toRefs(props),
      config,
      props.upwindConfig
    );

    const handleSelect = () => {
      emit("select", props.value, props.label, props.icon);
    };

    return {
      stylesheet,
      styles,
      handleSelect,
    };
  },
});
</script>
