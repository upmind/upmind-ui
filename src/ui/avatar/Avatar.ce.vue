<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <AvatarRoot
    :class="cn(styles.avatar, props.class)"
    :tabindex="focusable ? 0 : -1"
  >
    <slot>
      <Icon
        v-if="meta.hasIcon"
        :icon="icon"
        class="relative z-10 object-cover"
      />
      <IconAnimated
        v-else-if="meta.hasAnimatedIcon"
        v-bind="mergedAnimatedIcon"
        class="relative z-10 object-cover"
      />
      <AvatarImage
        v-else-if="meta.hasImage"
        :src="src"
        alt="avatar"
        class="relative z-10 object-cover"
      />
      <!-- forced caption for caption shinethrough -->
      <div
        v-if="meta.hasCaption"
        class="absolute top-0 right-0 bottom-0 left-0 z-0 inline-flex items-center justify-center text-center"
      >
        <span>{{ caption }}</span>
      </div>
    </slot>
  </AvatarRoot>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";
import config from "./avatar.config";

// --- components
import { Icon } from "../icon";
import { AvatarRoot, AvatarImage } from "radix-vue";
import IconAnimated from "../icon-animated/IconAnimated.ce.vue";
// --- utils
import { isEmpty, isString } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { AvatarProps } from ".";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<AvatarProps>(), {
  // --- props
  icon: undefined,
  animatedIcon: undefined,
  src: "",
  caption: "",
  //  --- styles
  color: "base",
  fit: "cover",
  shape: "circle",
  size: "auto",
  variant: "flat",

  // --- styles
  uiConfig: () => ({ avatar: [] }),
  class: ""
});

const meta = computed(() => ({
  color: props.color,
  fit: props.fit,
  shape: props.shape,
  size: props.size,
  variant: props.variant,
  focusable: props.focusable,
  // ---
  hasIcon: !isEmpty(props.icon),
  hasImage: !isEmpty(props.src),
  hasCaption: !isEmpty(props.caption) || true,
  hasAnimatedIcon: !isEmpty(props.animatedIcon)
}));

const mergedAnimatedIcon = computed(() => ({
  icon: isString(props.animatedIcon)
    ? props.animatedIcon
    : (props.animatedIcon?.icon as string),
  primaryColor: isString(props.animatedIcon)
    ? "base"
    : props.animatedIcon?.primaryColor,
  secondaryColor: isString(props.animatedIcon)
    ? "secondary"
    : props.animatedIcon?.secondaryColor,
  delay: isString(props.animatedIcon) ? 250 : props.animatedIcon?.delay,
  size: isString(props.animatedIcon) ? "auto" : props.animatedIcon?.size,
  trigger: isString(props.animatedIcon) ? "loop" : props.animatedIcon?.trigger
}));

const styles = useStyles(
  "avatar",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ avatar: string }>;
</script>
