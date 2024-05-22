<template>
  <figure class="avatar" :class="styles.avatar.root">
    <slot>
      <upw-icon v-if="hasIcon" :icon="avatar" :class="styles.avatar.icon" />

      <img
        v-else-if="hasImage"
        :src="avatar.src"
        alt="avatar"
        :class="styles.avatar.image"
      />

      <figcaption :class="styles.avatar.caption" v-else-if="hasCaption">
        {{ avatar.caption }}
      </figcaption>
    </slot>
  </figure>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import UpwIcon from "../icon/Icon.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";
import { isEmpty, isObject, isString } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { AvatarProps } from "./types";
// ----------------------------------------------

export default defineComponent({
  name: "UpwAvatar",
  components: {
    UpwIcon,
  },
  props: {
    size: {
      type: String,
      default: "auto",
      validator: (value: string) =>
        ["auto", "xs", "sm", "md", "lg", "xl", "2xl"].includes(value),
    },
    avatar: {
      type: [String, Object] as PropType<AvatarProps["avatar"]>,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
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
    hasIcon() {
      return (
        isString(this?.avatar) ||
        (isObject(this?.avatar) && !isEmpty(this?.avatar?.name))
      );
    },
    hasImage() {
      return isObject(this?.avatar) && !isEmpty(this?.avatar?.src);
    },
    hasCaption() {
      return isObject(this?.avatar) && !isEmpty(this?.avatar?.caption);
    },
  },
});
</script>

<style lang="scss">
.icon {
  > svg {
    width: apply(w-full);
    height: apply(h-full);
  }
}
</style>
./config.cva
