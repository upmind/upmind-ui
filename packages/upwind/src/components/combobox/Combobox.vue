<template>
  <h-combobox v-model="value" v-slot="{ open }">
    <div class="combobox" :class="styles.combobox.root">
      <upw-input
        :id="id"
        :label="label"
        :description="description"
        :errors="errors"
        :size="size"
        :append-avatar="appendAvatar"
        :append-icon="appendIcon"
        :append-text="appendText"
        :prepend-avatar="displayAvatar"
        :prepend-icon="displayIcon"
        :prepend-text="prependText"
        :feedback-icon="feedbackIcon"
        :dirty="meta.isDirty"
        :disabled="meta.isDisabled"
        :visible="meta.isVisible"
        :required="meta.isRequired"
        :no-required="noRequired"
        :no-feedback="noFeedback"
        :no-status="noStatus"
        :persist-feedback="persistFeedback"
        layout="stacked"
        variant="outlined"
        ref="reference"
      >
        <h-combobox-input
          :class="styles.combobox.input"
          :displayValue="value => displayValue || value?.label"
          @change="doSearch"
          @input="event => (processing = !!event.target.value.length)"
          prependIcon="search"
          autocomplete="off"
        />

        <h-combobox-button :class="styles.combobox.button">
          <upw-icon
            v-if="toggleIcon"
            :icon="toggleIcon"
            :class="styles.combobox.toggle"
            :aria-checked="open && toggleRotate"
            aria-hidden="true"
          />
        </h-combobox-button>
      </upw-input>

      <transition
        :enter-active-class="styles.comboboxTransitionEnter.active"
        :enter-from-class="styles.comboboxTransitionEnter.from"
        :enter-to-class="styles.comboboxTransitionEnter.to"
        :leave-active-class="styles.comboboxTransitionLeave.active"
        :leave-from-class="styles.comboboxTransitionLeave.from"
        :leave-to-class="styles.comboboxTransitionLeave.to"
      >
        <h-combobox-options
          class="combobox-options"
          :class="styles.combobox.items"
          ref="floating"
          :style="floatingStyles"
        >
          <li :class="styles.comboboxItem.root" v-if="meta.isProcessing">
            <upw-spinner :class="styles.comboboxItem.avatar" />
          </li>

          <li :class="styles.comboboxItem.root" v-else-if="!input?.length">
            {{ emptySearchText }}
          </li>

          <li :class="styles.comboboxItem.root" v-else-if="!results?.length">
            {{ emptyText }}
          </li>

          <h-combobox-option
            v-else
            v-for="(item, key) in results"
            :key="key"
            as="template"
            v-slot="{ active, selected }"
            :value="item.value"
            :disabled="item?.disabled"
          >
            <li
              :class="[
                styles.comboboxItem.root,
                active ? styles.comboboxItem.active : '',
                selected ? styles.comboboxItem.selected : '',
              ]"
            >
              <upw-icon
                v-if="item.avatar"
                :icon="item.avatar"
                class="avatar"
                :class="styles.comboboxItem.avatar"
                aria-hidden="true"
              />

              <upw-icon
                v-if="item.icon"
                :icon="item.icon"
                :class="styles.comboboxItem.icon"
                aria-hidden="true"
              />

              <span :class="styles.comboboxItem.label">{{ item.label }}</span>

              <upw-icon
                v-if="selectedIcon"
                :icon="selectedIcon"
                :class="[
                  styles.comboboxItem.icon,
                  { invisible: !selected, 'pointer-events-none': !selected },
                ]"
                aria-hidden="true"
              />
            </li>
          </h-combobox-option>
        </h-combobox-options>
      </transition>
    </div>
  </h-combobox>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, computed } from "vue";

// --- components
import { useFloating, offset, flip, shift } from "@floating-ui/vue";
import {
  Combobox,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  ComboboxInput,
} from "@headlessui/vue";
import UpwInput from "../input/Input.vue";
import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";
import {
  filter,
  find,
  isEmpty,
  isNil,
  debounce,
  includes,
  isFunction,
} from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ComboboxItems, ComboboxPosition } from "./types";
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwCombobox",
  components: {
    HCombobox: Combobox,
    HComboboxButton: ComboboxButton,
    HComboboxOptions: ComboboxOptions,
    HComboboxOption: ComboboxOption,
    HComboboxInput: ComboboxInput,
    UpwIcon,
    UpwInput,
    UpwSpinner,
  },
  emits: ["update:modelValue"],
  props: {
    id: {
      type: String,
      default: () => "textbox-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    description: { type: String },
    errors: { type: String },
    // ---
    size: { type: String as PropType<InputProps["size"]>, default: null },
    placement: {
      type: String as PropType<ComboboxPosition>,
      default: "bottom-end",
    },
    // ---
    appendAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendText: { type: String },
    // ---
    prependAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependText: { type: String },
    // ---
    feedbackIcon: {
      type: [Object, String] as PropType<IconProps["icon"]>,
      default: "information-circle",
    },
    toggleIcon: {
      type: [Object, String] as PropType<IconProps["icon"]>,
      default: "arrow-up-down",
    },
    selectedIcon: {
      type: [Object, String] as PropType<IconProps["icon"]>,
      default: "check-square",
    },
    emptyText: { type: String, default: "No results found" },
    emptySearchText: { type: String, default: "Start typing to search" },

    // ---
    modelValue: {
      type: [String, Array] as PropType<string[]>,
      default: "",
    },

    items: {
      type: Object as PropType<ComboboxItems>,
      default: () => {},
    },
    search: {
      type: [Function, Promise],
    },
    // ---
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    // ---
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean, default: true },
    toggleRotate: { type: Boolean, default: false },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },
  setup(props) {
    const value = ref(props.modelValue || "");
    const input = ref(null);
    const processing = ref(false);
    const results = ref(props.items);
    // ---
    const reference = ref(null);
    const floating = ref(null);
    const { floatingStyles } = useFloating(reference, floating, {
      placement: props.placement,
      middleware: [offset(10), flip(), shift()],
    });

    // ---
    const meta = computed(() => ({
      size: props.size,
      toggleRotate: props.toggleRotate,
      // ---
      isDisabled: props.disabled,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
      isProcessing: processing.value,
    }));

    const styles = useStyles(
      [
        "combobox",
        "comboboxItem",
        "comboboxTransitionEnter",
        "comboboxTransitionLeave",
      ],
      props,
      config,
      props.upwindConfig
    );
    // ---

    async function safeSearch(event) {
      processing.value = true;
      input.value = event.target.value;

      const value = event.target.value;
      if (!value) {
        results.value = props.items;
      } else if (isFunction(props.search)) {
        // --- now do the provided search
        results.value = await props.search(value);
      } else {
        // --- if no search function is provided, just filter the items
        results.value = filter(
          props.items,
          item =>
            includes(item.label.toLowerCase(), value.toLowerCase()) ||
            includes(item.value.toLowerCase(), value.toLowerCase())
        );
      }

      processing.value = false;
    }

    // ---

    return {
      meta,
      input,
      value,
      results,
      processing,
      // ---
      styles,
      reference,
      floating,
      floatingStyles,
      doSearch: debounce(safeSearch, 500),
    };
  },

  computed: {
    displayValue() {
      const selected = find(this.items, ["value", this.value]);
      if (selected) return selected?.label;
      return "";
    },
    displayIcon() {
      const selected = find(this.items, ["value", this.value]);
      return this.prependIcon || selected?.icon;
    },
    displayAvatar() {
      const selected = find(this.items, ["value", this.value]);
      return this.prependAvatar || selected?.avatar;
    },
  },

  watch: {
    value(value) {
      debugger;
      this.$emit("update:modelValue", value);

      // const item = find(this.items, ["value", value]);
      // this.$emit("update:modelValue", item?.value || undefined);
    },
  },
});
</script>
