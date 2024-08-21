<template>
  <avatar-root :class="styles.avatar.root">
    <slot>
      <avatar-image v-if="meta.hasImage" :src="avatar.src" alt="avatar" />
      <avatar-fallback v-if="meta.hasCaption" :class="styles.avatar.caption">
        {{ avatar.caption }}
      </avatar-fallback>
    </slot>
  </avatar-root>
</template>

<script lang="ts">
// --- components
import { AvatarFallback, AvatarImage } from "./index";
import { AvatarRoot } from "radix-vue";

// --- external
import { toRefs } from "vue";

// --- types
import { type AvatarVariants } from ".";
import type { HTMLAttributes } from "vue";

// --- utils
import { isEmpty, isString } from "lodash-es";
import { useStyles } from "../../../utils";

// --- config
import config from "./avatar.config";

export default {
  name: "UwAvatar",
  components: {
    AvatarFallback,
    AvatarImage,
    AvatarRoot,
  },
  props: {
    class: [String, Object, Array] as HTMLAttributes["class"],
    shape: {
      type: String as AvatarVariants["shape"],
      default: "circle",
    },
    size: {
      type: String as AvatarVariants["size"],
      default: "sm",
    },
    avatar: {
      type: Object,
      default: () => null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    upwindConfig: {
      type: Object,
      default: () => ({}),
    },
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
    };
  },

  computed: {
    meta() {
      return {
        isLoading: this.loading,
        hasIcon: isString(this.avatar) || !isEmpty(this.avatar?.name),
        hasImage: !isEmpty(this.avatar?.src),
        hasCaption: this.avatar?.forceCaption || !isEmpty(this.avatar?.caption),
      };
    },
  },
};
</script>
