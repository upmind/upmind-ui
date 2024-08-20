<template>
  <AvatarRoot :class="styles.avatar.root">
    <slot v-if="avatar === null" />

    <AvatarImage v-if="meta.hasImage" :src="avatar.src" alt="avatar" />

    <AvatarFallback v-if="meta.hasCaption" :class="styles.avatar.caption">
      {{ avatar.caption }}
    </AvatarFallback>

    <upw-spinner v-if="meta.isLoading" />

    <upw-icon v-if="meta.hasIcon" :icon="avatar" :class="styles.avatar.icon" />
  </AvatarRoot>
</template>

<script lang="ts">
// --- components
import UpwIcon from "../../icon/Icon.vue";
import UpwSpinner from "../../spinner/Spinner.vue";
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
  name: "Avatar",
  components: {
    UpwIcon,
    UpwSpinner,
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
    icon: {
      type: String,
      default: "",
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
