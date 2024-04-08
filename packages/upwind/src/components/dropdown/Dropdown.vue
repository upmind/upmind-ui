<template>
  <h-menu as="div" :class="styles.root" v-slot="{ open }">
    <h-menu-button
      class="dropdown-btn"
      :class="styles.button.root"
      ref="reference"
    >
      <span class="btn-label" :class="styles.button.label" v-if="label">
        {{ label }}
      </span>

      <upw-icon
        v-if="icon"
        :icon="icon"
        class="dropdown-btn-icon"
        :class="styles.button.icon"
        :aria-checked="open && icon === 'arrow-down' ? 'true' : 'false'"
      />
    </h-menu-button>

    <h-menu-items
      class="dropdown-items"
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
            :styles="styles.group.title"
          />

          <!-- group items -->
          <upw-dropdown-item
            v-for="(child, childKey) in item.children"
            :key="childKey"
            v-bind="child"
            :styles="styles.item"
          />
        </div>

        <!-- items -->
        <upw-dropdown-item v-else v-bind="item" :styles="styles.item" />
      </template>
    </h-menu-items>
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
    label: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "arrow-down",
    },
    placement: {
      type: String as PropType<DropdownPosition>,
      default: "bottom-end",
    },
    items: {
      type: Object as PropType<DropdownItems>,
      default: () => {},
    },
  },
  setup(props) {
    const reference = ref(null);
    const floating = ref(null);
    const { floatingStyles } = useFloating(reference, floating, {
      placement: props.placement,
      middleware: [offset(10), flip(), shift()],
    });

    const styles = useStyles("dropdown", config);

    return {
      styles,
      reference,
      floating,
      floatingStyles,
    };
  },
});
</script>
