<template>
  <h-listbox :multiple="multiple" v-model="value" v-slot="{ open }">
    <div class="listbox" :class="styles.listbox.root">
      <h-listbox-button
        :class="[
          styles.listboxButton.root,
          open ? styles.listboxButton.active : '',
        ]"
        ref="reference"
      >
        <upw-icon
          v-if="selectedAvatar"
          class="avatar"
          :class="styles.listboxButton.avatar"
          :icon="selectedAvatar"
        />

        <upw-icon
          v-if="selectedIcon"
          :icon="selectedIcon"
          :class="styles.listboxButton.icon"
        />

        <span class="label" :class="styles.listboxButton.label" v-if="label">
          {{ selectedLabel }}
        </span>

        <upw-icon
          v-if="toggle"
          :icon="toggle"
          :class="styles.listboxButton.toggle"
          :aria-checked="open && toggleRotate"
          aria-hidden="true"
        />
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
                styles.listboxItem.root,
                active ? styles.listboxItem.active : '',
                selected ? styles.listboxItem.selected : '',
              ]"
            >
              <upw-icon
                v-if="item.avatar"
                :icon="item.avatar"
                class="avatar"
                :class="styles.listboxItem.avatar"
                aria-hidden="true"
              />

              <upw-icon
                v-if="item.icon"
                :icon="item.icon"
                :class="styles.listboxItem.icon"
                aria-hidden="true"
              />

              <span :class="styles.listboxItem.label">{{ item.label }}</span>

              <upw-icon
                v-if="iconSelected"
                :icon="iconSelected"
                :class="[
                  styles.listboxItem.icon,
                  { invisible: !selected, 'pointer-events-none': !selected },
                ]"
                aria-hidden="true"
              />
            </li>
          </h-listbox-option>
        </h-listbox-options>
      </transition>
    </div>
  </h-listbox>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, watch } from "vue";

// --- components
import { useFloating, offset, flip, shift } from "@floating-ui/vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import UpwIcon from "../icon/Icon.vue";

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
      default: "Select option...",
    },
    icon: { type: [String, Object], default: null },
    avatar: { type: [String, Object], default: null },
    toggle: {
      type: String,
      default: "arrow-up-down",
    },
    toggleRotate: {
      type: Boolean,
      default: false,
    },

    iconSelected: {
      type: String,
      default: "check-square",
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
        "listboxButton",
        "listboxSearch",
        "listboxItem",
        "listboxTransitionEnter",
        "listboxTransitionLeave",
      ],
      props,
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
    selectedIcon() {
      if (this.multiple) {
        return this.icon;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.icon || selected?.icon;
      }
    },
    selectedAvatar() {
      if (this.multiple) {
        return this.avatar;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return this.avatar || selected?.avatar;
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
