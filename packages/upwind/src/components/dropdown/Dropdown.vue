<template>
  <h-menu :class="styles.root" v-slot="{ open }">
    <popper :show="open" :placement="placement">
      <h-menu-button class="dropdown-btn" :class="styles.button.root">
        <span class="btn-label" :class="styles.button.label" v-if="label">
          {{ label }}
        </span>

        <upw-icon
          v-if="icon"
          :name="icon"
          class="dropdown-btn-icon"
          :class="styles.button.icon"
          :aria-checked="open"
        />
      </h-menu-button>

      <template #content>
        <h-menu-items static class="dropdown-items" :class="styles.items">
          <h-menu-item
            v-for="(item, key) in items"
            :key="key"
            as="template"
            v-slot="{ active }"
          >
            <a
              v-if="item?.href"
              :href="item.href"
              :target="item?.target"
              :class="[styles.item.root, active ? styles.item.active : '']"
            >
              <upw-icon
                v-if="item.icon"
                :name="item.icon"
                :class="styles.item.icon"
                class="dropdown-item-icon"
              />

              <span>{{ item.label }}</span>
            </a>

            <button
              v-else-if="item?.action"
              @click="item.action"
              :class="[styles.item.root, active ? styles.item.active : '']"
            >
              <upw-icon
                v-if="item.icon"
                :name="item.icon"
                :class="styles.item.icon"
                class="dropdown-item-icon"
              />
              <span>{{ item.label }}</span>
            </button>

            <span
              v-else
              :class="[styles.item.root, active ? styles.item.active : '']"
            >
              <upw-icon
                v-if="item.icon"
                :name="item.icon"
                :class="styles.item.icon"
                class="dropdown-item-icon"
              />
              <span>{{ item.label }}</span>
            </span>
          </h-menu-item>
          <!-- <h-menu-item
              v-for="(item, index) in items"
              :key="item?.id || `item-${index}`"
              v-slot="{ active }"
            >
              <a
                :href="item.href"
                :class="[styles.item.root, active ? styles.item.active : '']"
              >
                {{ item.label }}
              </a>

              <button
                v-if="item?.action"
                @click="item.action"
                :class="[styles.item.root, active ? styles.item.active : '']"
              >
                {{ item.label }}
              </button>

              <span :class="[styles.item.root, active ? styles.item.active : '']">
                {{ item.label }}
              </span>
            </h-menu-item> -->
        </h-menu-items>
      </template>
    </popper>
  </h-menu>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";

// --- components
import Popper from "vue3-popper";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import UpwIcon from "../icon/Icon.vue";

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
    Popper,
    HMenu: Menu,
    HMenuButton: MenuButton,
    HMenuItems: MenuItems,
    HMenuItem: MenuItem,
    UpwIcon,
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
    const styles = useStyles("dropdown", config);

    return {
      styles,
    };
  },
});
</script>
