<template>
  <UwCommandItem
    :value="label"
    @select="handleSelect"
    :class="styles.combobox.item"
  >
    <upw-icon
      v-if="icon"
      :icon="icon"
      :class="styles.combobox.icons.listItem"
      aria-hidden="true"
    />
    {{ label }}
    <upw-icon
      v-if="isSelected"
      :class="styles.combobox.icons.checkItem"
      icon="check"
      aria-hidden="true"
    />
  </UwCommandItem>
</template>

<script lang="ts">
// --- external
import { computed, inject, toRefs, defineComponent } from "vue";

// --- internal
import config from "./combobox.config";

// --- components
import { UwCommandItem } from "../command";
import UpwIcon from "../../icon/Icon.vue";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import type { IconProps } from "../input/types";

export default defineComponent({
  components: {
    UwCommandItem,
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
      type: [String, Object] as PropType<IconProps["icon"]>,
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
      toRefs({ color: color }),
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
