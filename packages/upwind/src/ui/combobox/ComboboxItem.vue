<template>
  <link rel="stylesheet" :href="globalStyles" />
  <combobox-item
    :value="value"
    @select="handleSelect"
    :class="styles.combobox.item"
  >
    <upw-avatar
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
      <upw-icon v-if="isSelected" icon="check" size="xxs" aria-hidden="true" />
    </div>
  </combobox-item>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import globalStyles from "@/assets/upwind.css?url"; // ASSETS
import { useStyles } from "../../utils";
import config from "./combobox.config";

// --- components
import { ComboboxItem } from "radix-vue";
import UpwAvatar from "../avatar/Avatar.ce.vue";
import UpwIcon from "../icon/Icon.ce.vue";

// --- utils

export default defineComponent({
  name: "UpwComboboxItem",
  components: {
    ComboboxItem,
    UpwAvatar,
    UpwIcon,
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
    upwindConfig: {
      type: Object,
      default: null,
    },
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
      globalStyles,
      styles,
      handleSelect,
    };
  },
});
</script>
