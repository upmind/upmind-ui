<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <AvatarRoot :class="cn(variants.avatar, props.class)">
    <slot>
      <Icon
        v-if="meta.hasIcon"
        :icon="icon"
        class="relative z-10 object-cover"
      />
      <AvatarImage
        v-else-if="meta.hasImage"
        :src="src"
        alt="avatar"
        class="relative z-10 object-cover"
      />
      <!-- forced caption for caption shinethrough -->
      <span
        v-if="meta.hasCaption"
        class="absolute bottom-0 left-0 right-0 top-0 z-0 inline-flex items-center justify-center text-center"
      >
        {{ caption }}
      </span>
    </slot>
  </AvatarRoot>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import {
  useStyles,
  cn,
  //stylesheet
} from "../../utils";
import config from "./avatar.config";

// --- components
import { Icon } from "../icon";
import { AvatarRoot, AvatarImage } from "radix-vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { AvatarProps } from ".";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<AvatarProps>(), {
  // --- props
  icon: undefined,
  src: "",
  caption: "",
  //  --- variants
  color: "base",
  fit: "cover",
  shape: "circle",
  size: "auto",
  // --- styles
  upwindConfig: () => ({ avatar: {} }),
  class: "",
});

const meta = computed(() => ({
  color: props.color,
  fit: props.fit,
  shape: props.shape,
  size: props.size,
  // ---
  hasIcon: !isEmpty(props.icon),
  hasImage: !isEmpty(props.src),
  hasCaption: !isEmpty(props.caption) || true,
}));

const variants = useStyles(
  "avatar",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ avatar: string }>;
</script>
