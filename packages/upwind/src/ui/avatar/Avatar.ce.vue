<template>
  <link rel="stylesheet" :href="globalStyles" />

  <avatar-root :class="styles.avatar.root">
    <slot>
      <avatar-image
        v-if="meta.hasImage"
        :src="avatar.src"
        alt="avatar"
        :class="styles.avatar.image"
      />
      <avatar-fallback v-if="meta.hasCaption" :class="styles.avatar.caption">
        {{ avatar.caption }}
      </avatar-fallback>
    </slot>
  </avatar-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import { AvatarFallback, AvatarImage } from "radix-vue";
import { AvatarRoot } from "radix-vue";

// --- internal
import globalStyles from "@/assets/upwind.css?url"; // ASSETS
import { useStyles } from "../../utils";
import config from "./avatar.config";

// --- utils
import { isEmpty, isString } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { AvatarConfig } from "./types";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UwAvatar",
  components: {
    AvatarFallback,
    AvatarImage,
    AvatarRoot,
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
    avatar: { type: Object, default: () => ({}) },
    loading: { type: Boolean },
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
      styles,
      globalStyles,
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
});
</script>
