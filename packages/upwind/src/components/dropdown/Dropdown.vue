<template>
  <h-menu as="div" :class="styles.dropdown.root" v-slot="{ open }">
    <h-menu-button :class="styles.dropdownButton.root" ref="reference">
      <upw-icon
        v-if="icon"
        :icon="icon"
        class="btn-icon"
        :class="styles.dropdownButton.icon"
      />

      <span class="label" :class="styles.dropdownButton.label" v-if="label">
        {{ label }}
      </span>

      <upw-icon
        v-if="toggle"
        :icon="toggle"
        :class="styles.dropdownButton.toggle"
        :aria-checked="open && toggleRotate"
        aria-hidden="true"
      />
    </h-menu-button>

    <transition
      :enter-active-class="styles.dropdownTransitionEnter.active"
      :enter-from-class="styles.dropdownTransitionEnter.from"
      :enter-to-class="styles.dropdownTransitionEnter.to"
      :leave-active-class="styles.dropdownTransitionLeave.active"
      :leave-from-class="styles.dropdownTransitionLeave.from"
      :leave-to-class="styles.dropdownTransitionLeave.to"
    >
      <h-menu-items
        :class="styles.dropdown.items"
        ref="floating"
        :style="floatingStyles"
      >
        <template v-for="(item, key) in items" :key="key">
          <!-- grouped items -->
          <div v-if="item?.children" :class="styles.dropdownGroup.root">
            <!-- group title -->
            <upw-dropdown-item
              v-if="item?.label || item?.icon"
              v-bind="item"
              :styles="styles.dropdownGroupItem"
            />

            <!-- group items -->
            <upw-dropdown-item
              v-for="(child, childKey) in item.children"
              :key="childKey"
              v-bind="child"
              :styles="styles.dropdownItem"
            />
          </div>

          <!-- items -->
          <upw-dropdown-item
            v-else
            v-bind="item"
            :styles="styles.dropdownItem"
          />
        </template>
      </h-menu-items>
    </transition>
  </h-menu>
</template>

<script lang="ts">
// --- global
import { defineComponent, ref } from "vue";

// --- components
import { useFloating, offset, flip, shift } from "@floating-ui/vue";
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import UpwIcon from "../icon/Icon.vue";
import UpwDropdownItem from "./DropdownItem.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { DropdownPosition, DropdownItems } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwDropdown",
  components: {
    HMenu: Menu,
    HMenuButton: MenuButton,
    HMenuItems: MenuItems,
    UpwIcon,
    UpwDropdownItem,
  },
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

    icon: { type: [String, Object], default: null },

    toggle: {
      type: String,
      default: "arrow-down",
    },
    toggleRotate: {
      type: Boolean,
      default: true,
    },
    placement: {
      type: String as PropType<DropdownPosition>,
      default: "bottom-end",
    },
    items: {
      type: Object as PropType<DropdownItems>,
      default: () => {},
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const reference = ref(null);
    const floating = ref(null);
    const { floatingStyles } = useFloating(reference, floating, {
      placement: props.placement,
      middleware: [offset(10), flip(), shift()],
    });

    const { styles } = useStyles(
      [
        "dropdown",
        "dropdownButton",
        "dropdownGroup",
        "dropdownGroupItem",
        "dropdownItem",
        "dropdownTransitionEnter",
        "dropdownTransitionLeave",
      ],
      props,
      config,
      props.upwindConfig
    );

    return {
      styles,
      reference,
      floating,
      floatingStyles,
    };
  },
});
</script>
