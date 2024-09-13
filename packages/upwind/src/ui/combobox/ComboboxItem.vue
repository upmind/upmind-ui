<template>
  <combobox-item
    :value="label"
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
    <upw-avatar
      v-if="isSelected"
      :class="styles.combobox.icons.checkItem"
      icon="check"
      aria-hidden="true"
    />
  </combobox-item>
</template>

<script lang="ts">
// --- external
import { computed, inject, defineComponent } from "vue";

// --- internal
import config from "./combobox.config";

// --- components
import { ComboboxItem } from "radix-vue";
import UpwAvatar from "../avatar/Avatar.ce.vue";

// --- utils
import { useStyles } from "../../utils";

export default defineComponent({
  name: "UwComboboxItem",
  components: {
    ComboboxItem,
    UpwAvatar,
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
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const { onSelect, modelValue, color } = inject("comboboxContext") as {
      onSelect: (value: string, label: string, icon: string) => void;
      modelValue: Ref<string>;
      color: Ref<string>;
    };

    const styles = useStyles(
      ["combobox", "combobox.icons"],
      color,
      config,
      props.upwindConfig
    );

    const isSelected = computed(() => modelValue.value === props.value);

    const handleSelect = () => {
      onSelect(props.value, props.label, props.icon);
    };

    return {
      styles,
      isSelected,
      handleSelect,
    };
  },
});
</script>

<style src="@/assets/main.css" />
