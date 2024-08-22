<template>
  <avatar-image
    :as="as"
    :as-child="asChild"
    :src="src"
    :alt="alt"
    :class="styles.avatar.image"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import { AvatarImage } from "radix-vue";

// --- internal
import { useStyles } from "../../utils";
import config from "./avatar.config";

// --- types
import type { PropType } from "vue";
import type { AvatarImageProps } from "radix-vue";

export default defineComponent({
  name: "UwAvatarImage",
  components: {
    AvatarImage,
  },
  props: {
    src: { type: String as PropType<AvatarImageProps["src"]>, required: true },
    alt: { type: String, required: true },
    as: {
      type: String as PropType<AvatarImageProps["as"]>,
      default: "span",
    },
    asChild: {
      type: Boolean as PropType<AvatarImageProps["asChild"]>,
    },
  },
  setup(props) {
    const styles = useStyles("avatar", toRefs(props), config);

    return {
      styles,
    };
  },
});
</script>
