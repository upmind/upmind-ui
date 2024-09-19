<template>
  <link rel="stylesheet" :href="stylesheet" />

  <avatar-root :class="cn(styles.avatar.root, $attrs.class)">
    <slot>
      <u-icon v-if="meta.hasIcon" :icon="icon" :class="styles.avatar.icon" />
      <avatar-image
        v-else-if="meta.hasImage"
        :src="src"
        alt="avatar"
        :class="styles.avatar.image"
      />
      <avatar-fallback v-if="meta.hasCaption" :class="styles.avatar.caption">
        {{ caption }}
      </avatar-fallback>

      <!-- forced caption for caption shinethrough -->
      <span
        v-if="meta.hasImage && meta.hasCaption"
        :class="styles.avatar.caption"
      >
        {{ caption }}
      </span>
    </slot>
  </avatar-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import UIcon from "../icon/Icon.ce.vue";
import { AvatarFallback, AvatarImage } from "radix-vue";
import { AvatarRoot } from "radix-vue";

// --- internal
import { useStyles, cn, stylesheet } from "../../utils";
import config from "./avatar.config";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { AvatarConfig } from "./types";
import type { IconProps } from "../icon/types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UwAvatar",
  inheritAttrs: false,
  components: {
    AvatarFallback,
    AvatarImage,
    AvatarRoot,
    UIcon,
  },
  props: {
    color: { type: String as PropType<AvatarConfig["color"]>, default: "base" },
    fit: {
      type: String as PropType<AvatarConfig["fit"]>,
      default: "cover",
    },
    shape: {
      type: String as PropType<AvatarConfig["shape"]>,
      default: "circle",
    },
    size: {
      type: String as PropType<AvatarConfig["size"]>,
      default: "md",
    },
    icon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
    },
    src: { type: String, default: "" },
    caption: { type: String },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },

  setup(props) {
    const styles = useStyles(
      "avatar",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      styles,
      cn,
      stylesheet,
    };
  },

  computed: {
    meta() {
      return {
        hasIcon: !isEmpty(this.icon),
        hasImage: !isEmpty(this.src),
        hasCaption: !isEmpty(this.caption) || true,
      };
    },
  },
});
</script>
