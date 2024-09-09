<template>
  <figure class="avatar" :class="styles.avatar.root">
    <slot>
      <upw-spinner v-if="meta.isLoading" :class="styles.avatar.loading" />

      <upw-icon
        v-if="meta.hasIcon"
        :icon="avatar"
        :class="styles.avatar.icon"
      />

      <img
        v-else-if="meta.hasImage"
        :src="avatar.src"
        alt="avatar"
        :class="styles.avatar.image"
      />

      <figcaption :class="styles.avatar.caption" v-if="meta.hasCaption">
        {{ avatar.caption }}
      </figcaption>
    </slot>
  </figure>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent } from "vue";

// --- components
import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";
import { isEmpty, isString } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { AvatarProps } from "../../ui/avatar/types";
// ----------------------------------------------

export default defineComponent({
  name: "UpwAvatar",
  components: {
    UpwIcon,
    UpwSpinner,
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
    loading: {
      type: Boolean,
      default: false,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const meta = computed(() => ({
      size: props.size,
      // ---
      isLoading: props.loading,
      hasIcon: isString(props?.avatar) || !isEmpty(props?.avatar?.name),
      hasImage: !isEmpty(props?.avatar?.src),
      hasCaption:
        props?.avatar?.forceCaption ||
        (isEmpty(props?.avatar?.src) && !isEmpty(props?.avatar?.caption)),
      forceCaption: props?.avatar?.forceCaption,
    }));
    const styles = useStyles("avatar", meta, config, props.upwindConfig);

    return {
      styles,
      meta,
    };
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
