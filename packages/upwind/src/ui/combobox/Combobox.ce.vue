<template>
  <popover-root v-model:open="open">
    <popover-trigger>
      <uw-button
        variant="outline"
        color="base"
        role="combobox"
        :aria-expanded="open"
        :class="[styles.combobox.button, buttonClass]"
        :disabled="loading"
      >
        <span class="flex items-center truncate">
          <upw-avatar
            v-if="selected?.icon"
            :icon="selected?.icon"
            size="sm"
            shape="circle"
            fit="cover"
            :class="styles.combobox.icons.listItem"
            aria-hidden="true"
          />

          <span v-if="!loading || selected">{{
            selected?.label || label
          }}</span>
        </span>

        <div v-if="!loading" :class="styles.combobox.icons.arrowUpDown">
          <upw-icon icon="arrow-down" size="xs" aria-hidden="true" />
        </div>
        <div v-else :class="styles.combobox.icons.loading">
          <upw-spinner size="xs" />
        </div>
      </uw-button>
    </popover-trigger>
    <popover-portal>
      <popover-content
        :class="styles.combobox.content"
        :side="side"
        :side-offset="sideOffset"
        :align="align"
        :align-offset="alignOffset"
        :avoid-collisions="avoidCollisions"
        :collision-boundary="collisionBoundary"
        :collision-padding="collisionPadding"
        :arrow-padding="arrowPadding"
        :sticky="sticky"
        :hide-when-detached="hideWhenDetached"
        :update-position-strategy="updatePositionStrategy"
        :on-placed="onPlaced"
        :prioritize-position="prioritizePosition"
      >
        <combobox-root
          :open="open"
          :model-value="modelValue"
          :class="styles.combobox.root"
          :dismissable="dismissable"
          :position="position"
          :side="side"
          :side-offset="sideOffset"
          :align="align"
          :align-offset="alignOffset"
          :avoid-collisions="avoidCollisions"
          :collision-boundary="collisionBoundary"
          :collision-padding="collisionPadding"
          :arrow-padding="arrowPadding"
          :sticky="sticky"
          :hide-when-detached="hideWhenDetached"
          :update-position-strategy="updatePositionStrategy"
          :on-placed="onPlaced"
          :prioritize-position="prioritizePosition"
        >
          <div :class="styles.combobox.command.wrapper" cmdk-input-wrapper>
            <combobox-input
              auto-focus
              :class="styles.combobox.command.root"
              :placeholder="searchPlaceholder"
            />
          </div>

          <combobox-empty :class="styles.combobox.empty">
            <slot name="combobox-empty">
              {{ emptyMessage }}
            </slot>
          </combobox-empty>
          <combobox-content :class="styles.combobox.list">
            <div role="presentation">
              <combobox-group
                :class="styles.combobox.group"
                :as-child="asChild"
                :heading="heading"
              >
                <combobox-label v-if="heading" :class="styles.combobox.label">
                  {{ heading }}
                </combobox-label>
                <combobox-item
                  v-for="(item, index) in items"
                  @select="handleSelect"
                  :class="styles.combobox.item"
                  :key="index"
                  :value="item.value"
                  :label="item.label"
                  :icon="item.icon"
                />
              </combobox-group>
            </div>
          </combobox-content>
        </combobox-root>
      </popover-content>
    </popover-portal>
  </popover-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs, ref, provide, toRef, watch } from "vue";
import {
  PopoverTrigger,
  PopoverRoot,
  PopoverContent,
  PopoverPortal,
  ComboboxRoot,
  ComboboxInput,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxContent,
} from "radix-vue";

// --- internal
import config from "./combobox.config";

// --- components
import { UwButton } from "../button";
import UpwAvatar from "../avatar/Avatar.ce.vue";
import UpwIcon from "../icon/Icon.ce.vue";
import ComboboxItem from "./ComboboxItem.vue";
import UpwSpinner from "../../components/spinner/Spinner.vue";

// --- utils
import { useStyles } from "../../utils";
import { first } from "lodash-es";

// --- types
import { type ComboboxConfig } from "./types.d";

export default defineComponent({
  name: "UwCombobox",
  components: {
    UwButton,
    UpwAvatar,
    UpwIcon,
    UpwSpinner,
    ComboboxRoot,
    ComboboxInput,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxEmpty,
    ComboboxContent,
    PopoverRoot,
    PopoverContent,
    PopoverTrigger,
    PopoverPortal,
    ComboboxItem,
  },
  props: {
    modelValue: { type: String, default: "" },
    defaultItem: { type: Object },
    items: { type: Array, default: () => [] },
    width: { type: String as ComboboxConfig["width"], default: "md" },
    color: { type: String as ComboboxConfig["color"], default: "base" },
    label: { type: String, default: "Select an item" },
    searchPlaceholder: { type: String, default: "Search" },
    emptyMessage: { type: String, default: "No results" },
    heading: { type: String, default: "" },
    align: { type: String, default: "left" },
    sideOffset: { type: Number, default: 4 },
    side: { type: String },
    alignOffset: { type: Number },
    avoidCollisions: { type: Boolean },
    collisionBoundary: { type: [Object, Array] },
    collisionPadding: { type: [Number, Object] },
    arrowPadding: { type: Number },
    sticky: { type: String },
    hideWhenDetached: { type: Boolean },
    updatePositionStrategy: { type: String },
    onPlaced: { type: Function },
    prioritizePosition: { type: Boolean },
    dismissable: { type: Boolean, default: false },
    position: { type: String },
    asChild: { type: Boolean, default: false },
    upwindConfig: {},
    // Question to DC: Can we do this through upwindConfig?
    buttonClass: { type: String },
    loading: { type: Boolean, default: false },
  },
  emits: [
    "update:open",
    "update:modelValue",
    "escapeKeyDown",
    "pointerDownOutside",
    "focusOutside",
    "interactOutside",
    "dismiss",
  ],
  setup(props, { emit }) {
    const open = ref(false);
    const selected = ref(null);

    const styles = useStyles(
      ["combobox", "combobox.icons", "combobox.command"],
      toRefs({ ...props, open }),
      config,
      props.upwindConfig
    );

    const updateSelected = () => {
      selected.value = first(
        props.items.filter(item => item.value === props.defaultItem?.value)
      );
    };

    updateSelected();

    watch(
      () => props.defaultItem,
      (newDefaultItem: any) => {
        if (newDefaultItem && !selected.value) {
          selected.value =
            props.items.find(item => item.value === newDefaultItem.value) ||
            null;
        }
      },
      { immediate: true }
    );

    const onSelect = (value: string, label: string, icon: string) => {
      emit("update:modelValue", value);
      selected.value = { label, value, icon };
      open.value = false;
    };

    provide("comboboxContext", {
      onSelect,
      modelValue: toRef(props, "modelValue"),
      color: toRef(props, "color"),
    });

    return {
      open,
      styles,
      onSelect,
      selected,
    };
  },
});
</script>

<style src="@/assets/main.css" />
