<template>
  <label
    :for="id"
    :class="styles.label.root"
    v-if="!noRequired || !noStatus || (!noLabel && !!text)"
  >
    <slot
      v-bind="{
        meta,
        text,
        altText,
        requiredText,
        optionalText,
        style: styles.label,
      }"
    >
      <span :class="styles.label.text" v-if="text">
        {{ text }}
        <Badge
          v-if="altText"
          :class="styles.label.alt"
          :label="altText"
          variant="tonal"
          color="base"
          size="xs"
        />
      </span>
    </slot>

    <slot
      name="status"
      v-if="!noStatus && !disabled"
      v-bind="{ meta, requiredText, optionalText, style: styles.label }"
    >
      <span class="status" :class="styles.label.status">
        <span v-if="meta.showAsRequired" :class="styles.label.required">
          {{ requiredText }}
        </span>

        <span v-else-if="meta.showAsOptional" :class="styles.label.optional">
          {{ optionalText }}
        </span>
      </span>
    </slot>
  </label>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- local
import config from "./config.cva";

// --- components

// --- custom elements
import Badge from "../../ui/badge/Badge.ce.vue";

// --- utils
import { useStyles } from "../../utils";
import { isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { LabelProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UwpwLabel",
  inheritAttrs: false,
  emits: ["update:modelValue", "change"],
  components: { Badge },

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
    upwindConfig: { type: [Object, Array], default: () => ({}) },
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
