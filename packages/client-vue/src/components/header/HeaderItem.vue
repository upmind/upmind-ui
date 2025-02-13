<template>
  <component :is="as" v-bind="safeAttributes">
    <div
      class="text-primary-foreground hover:bg-primary-foreground/10 flex cursor-pointer select-none items-center rounded-lg px-3 py-1 no-underline opacity-80 transition-all duration-300 hover:opacity-100"
    >
      <Icon v-if="icon" :icon="icon" class="mr-[0.4rem] h-4 w-4" />
      <Avatar
        v-else
        v-bind="avatar"
        class="text-primary mr-[0.4rem] h-4 w-4 text-[0.5rem]"
      />
      <div>{{ label }}</div>
    </div>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import {
  UpmSessionLoginPopover,
  UpmSessionDetailsDropdown,
  UpmSessionDrawer,
  UpmSessionDialog,
} from "@upmind-automation/client-vue";

import { Icon, Avatar } from "@upmind-automation/upmind-ui";

// --- utils
import { pick } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    as: "a" | "router-link" | "drawer" | "popover" | "dropdown" | "dialog";
    icon: string;
    avatar: object;
    label: string;
    attributes: object;
    visible: boolean;
  }>(),
  {
    as: "a",
    icon: "",
    avatar: () => ({}),
    label: "",
    attributes: () => ({}),
    visible: true,
  }
);

const safeAttributes = computed(() => {
  switch (props.as) {
    case "a":
      return pick(props.attributes, ["href", "title"]);

    case "router-link":
      return pick(props.attributes, ["to", "title"]);

    case "dropdown":
      return UpmSessionDetailsDropdown;

    case "drawer":
      return UpmSessionDrawer;

    case "popover":
      return UpmSessionLoginPopover;

    case "dialog":
      return UpmSessionDialog;

    default:
      return {};
  }
});
</script>
