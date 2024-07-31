<template>
  <h-combobox v-model="value" v-slot="{ open }">
    <div :class="styles.combobox.root">
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
        :autofocus="autofocus"
        :dirty="meta.isDirty"
        :disabled="meta.isDisabled"
        :visible="meta.isVisible"
        :required="meta.isRequired"
        :no-required="noRequired"
        :no-feedback="noFeedback"
        :no-status="noStatus"
        :no-label="noLabel"
        :persist-feedback="persistFeedback"
        layout="stacked"
        variant="outlined"
      >
        <h-combobox-input
          v-bind="safeAttrs"
          :class="styles.combobox.input"
          :displayValue="value => displayValue || value?.label"
          @input="onSearch"
          @change="event => (processing = !!event.target.value.length)"
          prependIcon="search"
          autocomplete="off"
        />

        <h-combobox-button :class="styles.combobox.button">
          <upw-spinner
            :class="styles.combobox.item.avatar"
            v-if="meta.isProcessing"
          />

          <upw-icon
            v-else-if="toggleIcon && items?.length"
            :icon="toggleIcon"
            :class="styles.combobox.toggle"
            :aria-checked="open && toggleRotate"
            aria-hidden="true"
          />
        </h-combobox-button>
      </upw-input>

      <transition
        :enter-active-class="styles.combobox.transition.enter.active"
        :enter-from-class="styles.combobox.transition.enter.from"
        :enter-to-class="styles.combobox.transition.enter.to"
        :leave-active-class="styles.combobox.transition.leave.active"
        :leave-from-class="styles.combobox.transition.leave.from"
        :leave-to-class="styles.combobox.transition.leave.to"
      >
        <!-- <div v-show="open && results?.length"> -->
        <h-combobox-options :class="styles.combobox.items">
          <li :class="styles.combobox.item.root" v-if="meta.isProcessing">
            <!-- empty when processing -->
          </li>

          <li
            :class="styles.combobox.item.root"
            v-else-if="!input?.length && !results?.length"
          >
            {{ emptySearchText }}
          </li>

          <li
            :class="styles.combobox.item.root"
            v-else-if="!results?.length && !queryResult"
          >
            {{ emptyText }}
          </li>

          <template v-else>
            <h-combobox-option
              v-if="queryResult"
              :value="queryResult"
              as="template"
              v-slot="{ active, selected }"
            >
              <li
                :class="[
                  styles.combobox.item.root,
                  active ? styles.combobox.item.active : '',
                  selected ? styles.combobox.item.selected : '',
                ]"
              >
                <span :class="styles.combobox.item.label">{{
                  queryResult[itemLabel]
                }}</span>

                <upw-icon
                  v-if="selectedIcon"
                  :icon="selectedIcon"
                  :class="[
                    styles.combobox.item.icon,
                    {
                      invisible: !selected,
                      'pointer-events-none': !selected,
                    },
                  ]"
                  aria-hidden="true"
                />
              </li>
            </h-combobox-option>

            <template v-for="(item, key) in results" :key="key">
              <li
                v-if="item?.as == 'separator'"
                :class="styles.combobox.item.separator"
              >
                <upw-icon
                  v-if="item.avatar"
                  :icon="item.avatar"
                  class="avatar"
                  :class="styles.combobox.item.avatar"
                  aria-hidden="true"
                />

                <upw-icon
                  v-if="item.icon"
                  :icon="item.icon"
                  :class="styles.combobox.item.icon"
                  aria-hidden="true"
                />

                <span
                  :class="styles.combobox.item.label"
                  v-if="item[itemLabel]"
                  >{{ item[itemLabel] }}</span
                >
              </li>

              <h-combobox-option
                v-else-if="item?.as == 'button'"
                as="template"
                v-slot="{ active, selected }"
                :value="item"
                :disabled="item?.disabled"
              >
                <li :class="styles.combobox.item.root">
                  <upw-button
                    v-bind="item"
                    :prepend-avatar="item.avatar"
                    :prepend-icon="item.icon"
                    :disabled="selected"
                  />
                </li>
              </h-combobox-option>

              <h-combobox-option
                v-else
                as="template"
                v-slot="{ active, selected }"
                :value="item"
                :disabled="item?.disabled"
              >
                <li
                  :class="[
                    styles.combobox.item.root,
                    active ? styles.combobox.item.active : '',
                    selected ? styles.combobox.item.selected : '',
                  ]"
                >
                  <upw-icon
                    v-if="item.avatar"
                    :icon="item.avatar"
                    class="avatar"
                    :class="styles.combobox.item.avatar"
                    aria-hidden="true"
                  />

                  <upw-icon
                    v-if="item.icon"
                    :icon="item.icon"
                    :class="styles.combobox.item.icon"
                    aria-hidden="true"
                  />

                  <span :class="styles.combobox.item.label">{{
                    item[itemLabel]
                  }}</span>

                  <upw-icon
                    v-if="selectedIcon"
                    :icon="selectedIcon"
                    :class="[
                      styles.combobox.item.icon,
                      {
                        invisible: !selected,
                        'pointer-events-none': !selected,
                      },
                    ]"
                    aria-hidden="true"
                  />
                </li>
              </h-combobox-option>
            </template>
          </template>
        </h-combobox-options>
        <!-- </div> -->
      </transition>
    </div>
  </h-combobox>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, computed, onMounted } from "vue";

// --- local
import config from "./config.cva";

// --- components
import {
  Combobox,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  ComboboxInput,
} from "@headlessui/vue";
import UpwButton from "../button/Button.vue";
import UpwInput from "../input/Input.vue";
import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- utils
import { useStyles } from "../../utils";
import {
  debounce,
  filter,
  find,
  get,
  includes,
  isEmpty,
  isFunction,
  isNil,
  pick,
  reject,
  some,
} from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ComboboxPosition } from "./types";
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwCombobox",
  inheritAttrs: false,
  emits: ["update:modelValue", "change"],
  components: {
    HCombobox: Combobox,
    HComboboxButton: ComboboxButton,
    HComboboxOptions: ComboboxOptions,
    HComboboxOption: ComboboxOption,
    HComboboxInput: ComboboxInput,
    UpwIcon,
    UpwInput,
    UpwSpinner,
    UpwButton,
  },
  props: {
    id: {
      type: String,
      default: () => "textbox-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    description: { type: String },
    errors: { type: String },
    // ---
    size: { type: String as PropType<InputProps["size"]> },
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
    modelValue: { type: String },

    items: {
      type: Object as PropType<Combobox.items>,
      default: () => {},
    },
    itemLabel: {
      type: String,
      default: "label",
    },
    itemValue: {
      type: String,
      default: "value",
    },

    search: {
      type: [Function, Promise],
    },
    // ---
    autofocus: { type: Boolean },
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    // ---
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noLabel: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean },
    toggleRotate: { type: Boolean, default: false },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },
  setup(props) {
    const value = ref(props.modelValue || "");
    const input = ref(null);
    const processing = ref(false);
    const results = ref(props.items || []);
    // ---
    const meta = computed(() => ({
      size: props.size,
      toggleRotate: props.toggleRotate,
      // ---
      isDisabled: props.disabled,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(value.value),
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(value.value),
      isProcessing: processing.value,
    }));

    const styles = useStyles(
      [
        "combobox",
        "combobox.item",
        "combobox.transition.enter",
        "combobox.transition.leave",
      ],
      meta,
      config,
      props.upwindConfig
    );
    // ---

    async function safeSearch(event?: Event) {
      input.value = event?.target?.value;
      processing.value = !!input.value;

      if (!input.value) {
        results.value = reject(props.items, "persist");
      } else if (isFunction(props.search)) {
        results.value = await props.search(input.value);
      } else {
        // --- if no search function is provided, just filter the items
        results.value = filter(
          props.items,
          item =>
            !item.persist &&
            (includes(
              item?.[props.itemLabel]?.toLowerCase(),
              input.value.toLowerCase()
            ) ||
              includes(
                item?.[props.itemValue]?.toLowerCase(),
                input.value.toLowerCase()
              ))
        );
      }

      const presistedItems = filter(props.items, "persist");

      if (presistedItems.length > 0) {
        if (results.value.length) results.value.push({ as: "separator" });
        results.value.push(...presistedItems);
      }

      processing.value = false;
    }

    onMounted(() => {
      safeSearch();
    });

    // ---

    return {
      meta,
      input,
      value,
      results,
      processing,
      // ---
      styles,
      onSearch: debounce(safeSearch, 500),
    };
  },

  computed: {
    safeAttrs() {
      return pick(this.$attrs, [
        "class",
        "value",
        "readonly",
        "placeholder",
        "tabindex",
        "maxlength",
        "name",
        "onChange",
        "onFocus",
        "onBlur",
      ]);
    },

    queryResult() {
      return this.input &&
        !this.meta.isProcessing &&
        !some(this.results, [this.itemValue, this.input])
        ? { [this.itemValue]: this.input, [this.itemLabel]: this.input }
        : null;
    },

    displayValue() {
      // const selected = find(this.results, [this.itemValue, this.value]);
      const value = get(this.value, this.itemLabel);
      return value;
    },
    displayIcon() {
      const selected = find(this.items, [this.itemValue, this.value]);
      return this.prependIcon || selected?.icon;
    },
    displayAvatar() {
      const selected = find(this.items, [this.itemValue, this.value]);
      return this.prependAvatar || selected?.avatar;
    },
  },

  watch: {
    items: {
      immediate: true,
      handler() {
        this.results = this.items;
      },
    },
    value(value) {
      value = get(value, this.itemValue, value); // safetycheck in case we get an object

      this.$emit("update:modelValue", value);

      // forward the event to our form renderer that will trigger the update
      // NB: this is not a DOM event so we need to fake one for the renderer
      this.$emit("change", { currentTarget: { value } });
    },
  },
});
</script>
