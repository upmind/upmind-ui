<template>
  <h-menu as="div" :class="styles.root" v-slot="{ open }">
    <h-menu-button :class="styles.button.root" ref="reference">
      <upw-icon
        v-if="icon"
        :icon="icon"
        class="btn-icon"
        :class="styles.button.icon"
      />

      <span class="label" :class="styles.button.label" v-if="label">
        {{ label }}
      </span>

      <upw-icon
        v-if="toggle"
        :icon="toggle"
        :class="styles.button.toggle"
        :aria-checked="open && toggleRotate"
        aria-hidden="true"
      />
    </h-menu-button>

    <transition
      :enter-active-class="styles?.transition?.enter?.active?.join(' ')"
      :enter-from-class="styles?.transition?.enter?.from?.join(' ')"
      :enter-to-class="styles?.transition?.enter?.to?.join(' ')"
      :leave-active-class="styles?.transition?.leave?.active?.join(' ')"
      :leave-from-class="styles?.transition?.leave?.from?.join(' ')"
      :leave-to-class="styles?.transition?.leave?.to?.join(' ')"
    >
      <h-menu-items
        :class="styles.items"
        ref="floating"
        :style="floatingStyles"
      >
        <template v-for="(item, key) in items" :key="key">
          <!-- grouped items -->
          <div v-if="item?.children" :class="styles.group.root">
            <!-- group title -->
            <upw-dropdown-item
              v-if="item?.label || item?.icon"
              v-bind="item"
              :upwind-config="styles.group.title"
            />

            <!-- group items -->
            <upw-dropdown-item
              v-for="(child, childKey) in item.children"
              :key="childKey"
              v-bind="child"
              :upwind-config="styles.item"
            />
          </div>

          <!-- items -->
          <upw-dropdown-item v-else v-bind="item" :upwindConfig="styles.item" />
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
import config from "./config";

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

    const styles = useStyles("dropdown", { props }, config, props.upwindConfig);

    return {
      styles,
      reference,
      floating,
      floatingStyles,
    };
  },
});
</script>
./config
