<template>
  <alert :color="color" :variant="variant">
    <upw-icon :icon="icon" :class="styles.alert.icon" />
    <alert-title>
      {{ title }}
    </alert-title>
    <alert-description>
      {{ description }}
    </alert-description>
  </alert>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import config from "./alert.config";

// --- components
import { Alert, AlertDescription, AlertTitle } from ".";
import UpwIcon from "../../icon/Icon.vue";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import { type AlertVariants } from ".";
import type { IconProps } from "../../icon/types";
import type { PropType } from "vue";

export default defineComponent({
  components: {
    Alert,
    AlertTitle,
    AlertDescription,
    UpwIcon,
  },

  props: {
    variant: {
      type: String as PropType<AlertVariants["variant"]>,
    },
    color: {
      type: String as PropType<AlertVariants["color"]>,
      default: "base",
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    icon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
    },
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const styles = useStyles(
      "alert",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      styles,
    };
  },
});
</script>
