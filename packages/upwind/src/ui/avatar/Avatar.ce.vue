<template>
  <link rel="stylesheet" :href="globalStyles" />

  <avatar-root :class="styles.avatar.root">
    <slot>
      <upw-icon
        v-if="meta.hasIcon"
        :icon="icon"
        :class="styles.avatar.icon"
        :upwindConfig="{ icon: config.avatar.icon }"
      />
      <avatar-image v-else-if="meta.hasImage" :src="src" alt="avatar" />
      <avatar-fallback v-if="meta.hasCaption" :class="styles.avatar.caption">
        {{ caption }}
      </avatar-fallback>
    </slot>
  </avatar-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import UpwIcon from "../icon/Icon.ce.vue";
import { AvatarFallback, AvatarImage } from "radix-vue";
import { AvatarRoot } from "radix-vue";

// --- internal
import globalStyles from "../../assets/upwind.css?url"; // ASSETS
import { useStyles } from "../../utils";
import config from "./avatar.config";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { AvatarConfig } from "./types";
import type { IconProps } from "../../components/icon/types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UwAvatar",
  components: {
    AvatarFallback,
    AvatarImage,
    AvatarRoot,
    UpwIcon,
  },
  props: {
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
      required: true,
    },
    src: { type: String },
    caption: { type: String },
    upwindConfig: { type: Object, default: () => ({}) },
  },

  setup(props) {
    const styles = useStyles(
      "avatar",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      config,
      styles,
      globalStyles,
    };
  },

  computed: {
    meta() {
      return {
        hasIcon: !isEmpty(this.icon),
        hasImage: !isEmpty(this.src),
        hasCaption: !isEmpty(this.caption),
      };
    },
  },
});
</script>
