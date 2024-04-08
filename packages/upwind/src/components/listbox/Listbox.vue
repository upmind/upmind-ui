<template>
  <h-listbox :multiple="multiple" v-model="value" v-slot="{ open }">
    <div class="listbox" :class="styles.root">
      <h-listbox-button
        class="listbox-btn"
        :class="[styles.button.root, open ? styles.button.active : '']"
        ref="reference"
      >
        <upw-icon
          v-if="selectedIcon"
          :icon="selectedIcon"
          class="btn-icon"
          :class="styles.button.icon"
        />

        <span class="btn-label" :class="styles.button.label" v-if="label">
          {{ selectedLabel }}

          {{ open ? "" : "" }}
        </span>

        <upw-icon
          v-if="icon"
          :icon="icon"
          class="listbox-btn-icon size-[1em]"
        />
      </h-listbox-button>

      <transition
        :enter-active-class="styles?.transition?.enter?.active?.join(' ')"
        :enter-from-class="styles?.transition?.enter?.from?.join(' ')"
        :enter-to-class="styles?.transition?.enter?.to?.join(' ')"
        :leave-active-class="styles?.transition?.leave?.active?.join(' ')"
        :leave-from-class="styles?.transition?.leave?.from?.join(' ')"
        :leave-to-class="styles?.transition?.leave?.to?.join(' ')"
      >
        <h-listbox-options
          class="listbox-options"
          :class="styles.items"
          ref="floating"
          :style="floatingStyles"
        >
          <div :class="styles.search.root" v-if="searchable">
            <input
              tabindex="0"
              type="search"
              v-model="search"
              class="form-input"
              :class="styles.search.input"
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
                styles.item.root,
                active ? styles.item.active : '',
                selected ? styles.item.selected : '',
              ]"
            >
              <upw-icon
                v-if="item.icon"
                :icon="item.icon"
                :class="styles.item.icon"
                aria-hidden="true"
              />

              <span :class="styles.item.label">{{ item.label }}</span>

              <upw-icon
                v-if="selected"
                icon="check-square"
                :class="styles.item.icon"
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
// --- global
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
import config from "./config";

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
    label: {
      type: String,
      default: "Select option...",
    },
    icon: {
      type: String,
      default: "arrow-up-down",
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
      type: [String, Array as PropType<string[]>],
      default: "",
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    searchable: {
      type: Boolean,
      default: false,
    },
    counter: {
      type: String,
      default: null,
    },
  },
  setup(props, { emit }) {
    // --- initial value with correct type and value
    const fallbackValue = props.multiple ? [] : "";
    let initialValue = get(props, "value", fallbackValue);

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

    const styles = useStyles("listbox", config);

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
        const selected = map(this.value, item => {
          const selected = find(this.items, ["value", item]);
          return selected?.icon;
        });

        return selected?.length ? "check-square" : null;
      } else {
        const selected = find(this.items, ["value", this.value]);
        return selected?.icon;
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
./config
