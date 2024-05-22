<template>
  <h-listbox :multiple="multiple" v-model="value" v-slot="{ open }">
    <div class="listbox" :class="styles.listbox.root">
      <h-listbox-button
        :class="[styles.listbox.trigger, open ? styles.listbox.active : '']"
        ref="reference"
      >
        <!-- prepend slot-->
        <slot
          name="prepend"
          v-bind="{
            styles: styles.dropdown,
            prependIcon: selectedPrependIcon,
            prependAvatar: selectedPrependAvatar,
            prependText: selectedPrependText,
            size,
            label: selectedLabel,
            open,
            disabled,
            loading,
          }"
        >
          <span v-if="selectedPrependText" :class="styles.listbox.prepend">
            {{ selectedPrependText }}
          </span>

          <upw-avatar
            v-if="selectedPrependAvatar"
            :class="styles.listbox.avatar"
            :avatar="selectedPrependAvatar"
          />

          <upw-icon
            v-if="selectedPrependIcon"
            :class="styles.listbox.icon"
            :icon="selectedPrependIcon"
          />
        </slot>

        <!-- default 'slot' -->
        <span :class="styles.listbox.label" v-if="selectedLabel">
          {{ selectedLabel }}
        </span>

        <!-- append slot -->
        <slot
          name="append"
          v-bind="{
            styles: styles.dropdown,
            appendIcon: selectedAppendIcon,
            appendAvatar: selectedAppendAvatar,
            appendText: selectedAppendText,
            size,
            label,
            toggle,
            toggleRotate,
            open,
            disabled,
            loading,
          }"
        >
          <upw-icon
            v-if="selectedAppendIcon"
            :class="styles.listbox.icon"
            :icon="selectedAppendIcon"
          />

          <upw-avatar
            v-if="selectedAppendAvatar"
            class="avatar"
            :class="styles.listbox.avatar"
            :avatar="selectedAppendAvatar"
          />

          <span :class="styles.listbox.append" v-if="selectedAppendText">
            {{ selectedAppendText }}
          </span>

          <!-- loading / toggle -->
          <upw-spinner
            :class="styles.listbox.loading"
            v-if="loading"
            aria-hidden="true"
          />

          <upw-icon
            v-else-if="toggle"
            :icon="toggle"
            :class="styles.listbox.toggle"
            :aria-checked="open && toggleRotate"
            aria-hidden="true"
          />
        </slot>
      </h-listbox-button>

      <transition
        :enter-active-class="styles.listboxTransitionEnter.active"
        :enter-from-class="styles.listboxTransitionEnter.from"
        :enter-to-class="styles.listboxTransitionEnter.to"
        :leave-active-class="styles.listboxTransitionLeave.active"
        :leave-from-class="styles.listboxTransitionLeave.from"
        :leave-to-class="styles.listboxTransitionLeave.to"
      >
        <h-listbox-options
          class="listbox-options"
          :class="styles.listbox.items"
          ref="floating"
          :style="floatingStyles"
        >
          <div :class="styles.listboxSearch.root" v-if="hasSearch">
            <input
              tabindex="0"
              type="search"
              v-model="search"
              class="form-input"
              :class="styles.listboxSearch.input"
              placeholder="Search..."
            />
          </div>

          <h-listbox-option
            v-for="(item, key) in filteredItems"
            :key="key"
            as="template"
            v-slot="{ active, selected }"
            :value="item.value"
            :disabled="item?.disabled"
          >
            <li
              :class="[
                styles.listbox.item,
                active ? styles.listbox.activeItem : '',
                selected ? styles.listbox.selectedItem : '',
              ]"
            >
              <!-- prepend slot-->
              <slot
                name="prepend"
                v-bind="{
                  styles: styles.dropdown,
                  ...item,
                }"
              >
                <span
                  class="prependText"
                  :class="styles.listbox.prepend"
                  v-if="item.prependText"
                >
                  {{ item.prependText }}
                </span>

                <upw-avatar
                  v-if="item.prependAvatar"
                  :class="styles.listbox.avatar"
                  :avatar="item.prependAvatar"
                />

                <upw-icon
                  v-if="item.prependIcon"
                  :class="styles.listbox.icon"
                  :icon="item.prependIcon"
                />
              </slot>

              <!-- default 'slot' -->
              <span
                class="label"
                :class="styles.listbox.label"
                v-if="item.label"
              >
                {{ item.label }}
              </span>

              <!-- append slot -->
              <slot
                name="append"
                v-bind="{
                  styles: styles.dropdown,
                  ...item,
                }"
              >
                <upw-icon
                  v-if="item.appendIcon"
                  :class="styles.listbox.icon"
                  :icon="item.appendIcon"
                />

                <upw-avatar
                  v-if="item.appendAvatar"
                  class="avatar"
                  :class="styles.listbox.avatar"
                  :avatar="item.appendAvatar"
                />

                <span
                  v-if="item.appendText"
                  class="appendText"
                  :class="styles.listbox.append"
                >
                  {{ item.appendText }}
                </span>

                <!-- loading  -->
                <upw-spinner
                  :class="styles.listbox.loading"
                  v-if="item.loading"
                  :size="size"
                />

                <upw-icon
                  v-if="iconSelected"
                  :icon="iconSelected"
                  :class="[
                    styles.listbox.toggle,
                    { invisible: !selected, 'pointer-events-none': !selected },
                  ]"
                  aria-hidden="true"
                />
              </slot>
            </li>
          </h-listbox-option>
        </h-listbox-options>
      </transition>
    </div>
  </h-listbox>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, watch, toRefs } from "vue";
import { useFloating, offset, flip, shift } from "@floating-ui/vue";

// --- components
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import UpwIcon from "../icon/Icon.vue";
import UpwAvatar from "../avatar/Avatar.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";
import { find, get, isArray, first, map, filter } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ListboxItems } from "./types";
import type { ListboxPosition } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwListbox",
  components: {
    HListbox: Listbox,
    HListboxButton: ListboxButton,
    HListboxOptions: ListboxOptions,
    HListboxOption: ListboxOption,
    UpwIcon,
    UpwAvatar,
    UpwSpinner,
  },
  emits: ["update:modelValue"],
  props: {
    size: {
      type: String,
      default: "md",
      validator: value => ["sm", "md", "lg"].includes(value),
    },
    // ---
    label: {
      type: String,
      default: "",
    },

    // ---
    appendAvatar: {
      type: [Object, String] as PropType<DropdownProps["avatar"]>,
    },
    appendIcon: { type: [Object, String] as PropType<DropdownProps["icon"]> },
    appendText: { type: String },
    // ---
    prependAvatar: {
      type: [Object, String] as PropType<DropdownProps["avatar"]>,
    },
    prependIcon: { type: [Object, String] as PropType<DropdownProps["icon"]> },
    prependText: { type: String },
    // ---
    iconSelected: {
      type: String,
      default: "check-square",
    },
    toggle: {
      type: String,
      default: "arrow-up-down",
    },
    toggleRotate: {
      type: Boolean,
      default: false,
    },

    placement: {
      type: String as PropType<ListboxPosition>,
      default: "bottom-start",
    },
    items: {
      type: Object as PropType<ListboxItems>,
      default: () => {},
    },
    modelValue: {
      type: [String, Array] as PropType<string[]>,
      default: "",
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    hasSearch: {
      type: Boolean,
      default: false,
    },
    counter: {
      type: String,
      default: null,
    },
    grouped: {
      type: Boolean,
      default: false,
    },
    // ---
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props, { emit }) {
    // --- initial value with correct type and value
    const fallbackValue = props.multiple ? [] : "";
    let initialValue = get(props, "modelValue", fallbackValue);

    initialValue = props.multiple
      ? isArray(initialValue)
        ? initialValue
        : [initialValue]
      : isArray(initialValue)
        ? first(initialValue)
        : initialValue;

    // ---
    const value = ref(initialValue);
    const reference = ref(null);
    const floating = ref(null);
    const { floatingStyles } = useFloating(reference, floating, {
      placement: props.placement,
      middleware: [offset(10), flip(), shift()],
    });

    const styles = useStyles(
      [
        "listbox",
        "listboxSearch",
        "listboxTransitionEnter",
        "listboxTransitionLeave",
      ],
      toRefs(props),
      config,
      props.upwindConfig
    );
    watch(value, value => {
      const item = find(props.items, ["value", value]);
      emit("update:modelValue", item?.value || "");
    });

    return {
      value,
      search: ref(),
      styles,
      reference,
      floating,
      floatingStyles,
    };
  },
  computed: {
    selectedLabel() {
      if (this.multiple) {
        const selected = map(this.value, item => {
          const selected = find(this.items, ["value", item]);
          return selected?.label;
        });

        if (selected?.length && this.counter)
          return `${selected.length} ${this.counter}`;
        if (selected?.length) return selected.join(", ");
      } else {
        const selected = find(this.items, ["value", this.value]);
        if (selected) return selected?.label;
      }

      return this.label;
    },
    selectedPrependIcon() {
      if (this.multiple) {
        return this.prependIcon;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.prependIcon || selected?.prependIcon;
      }
    },
    selectedPrependAvatar() {
      if (this.multiple) {
        return this.prependAvatar;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.prependAvatar || selected?.prependAvatar;
      }
    },
    selectedPrependText() {
      if (this.multiple) {
        return this.prependText;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.prependText || selected?.prependText;
      }
    },

    selectedAppendIcon() {
      if (this.multiple) {
        return this.appendIcon;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.appendIcon || selected?.appendIcon;
      }
    },
    selectedAppendAvatar() {
      if (this.multiple) {
        return this.appendAvatar;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.appendAvatar || selected?.appendAvatar;
      }
    },
    selectedAppendText() {
      if (this.multiple) {
        return this.appendText;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.appendText || selected?.appendText;
      }
    },
    filteredItems() {
      if (!this.search) return this.items;

      return filter(
        this.items,
        item =>
          item?.label?.toLowerCase()?.includes(this.search?.toLowerCase()) ||
          item?.value?.toLowerCase()?.includes(this.search?.toLowerCase())
      );
    },
  },
});
</script>
