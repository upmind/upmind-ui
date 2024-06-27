<template>
  <label
    :for="id"
    :class="styles.label.root"
    v-if="!noRequired || !noStatus || (!noLabel && !!text)"
  >
    <span :class="styles.label.text" v-if="text">
      {{ text }}
    </span>

    <span
      class="status"
      :class="styles.label.status"
      v-if="!noStatus && !disabled"
    >
      <span v-if="meta.showAsRequired" :class="styles.label.required">
        {{ requiredText }}
      </span>

      <span v-else-if="meta.showAsOptional" :class="styles.label.optional">
        {{ optionalText }}
      </span>
    </span>

    <span v-if="altText" :class="styles.label.alt">
      {{ altText }}
    </span>
  </label>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwIcon from "../icon/Icon.vue";

// --- utils
import { useStyles } from "../../utils";
import { isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { LabelProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwLabel",
  inheritAttrs: false,
  emits: ["update:modelValue", "change"],
  components: {
    UpwIcon,
  },

  props: {
    id: { type: String },
    text: { type: String },
    altText: { type: String },
    requiredText: { type: String, default: "Required" },
    optionalText: { type: String },
    // ---
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noLabel: { type: Boolean },
    // ---
    required: { type: Boolean },
    dirty: { type: Boolean },
    invalid: { type: Boolean },
    disabled: { type: Boolean },
    // ---
    size: { type: String as PropType<LabelProps["size"]> },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object] },
  },

  setup(props) {
    const meta = computed(() => ({
      size: props.size,
      // ---
      isValid: !props.invalid && props.dirty,
      isInvalid: props.invalid,
      showLabel: !props.noLabel,
      showAsRequired: props.required && !props.noRequired,
      showAsOptional:
        !props.required && !props.noRequired && !isEmpty(props.optionalText),
    }));

    const styles = useStyles("label", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
    };
  },

  computed: {
    computedIcon() {
      return this.meta.isChecked ? this.checkedIcon : this.uncheckedIcon;
    },
  },

  methods: {
    doChange(event: Event) {
      this.$emit("update:modelValue", !this.modelValue);
      this.$emit("change", event);
    },
  },
});
</script>
