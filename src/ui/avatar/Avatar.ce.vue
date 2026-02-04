<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <AvatarRoot
    :class="cn(styles.avatar, props.class)"
    :tabindex="focusable ? 0 : -1"
  >
    <slot>
      <Icon
        v-if="meta.hasIcon"
        :icon="props.icon!"
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
      <span
        v-if="meta.hasCaption"
        class="absolute top-0 right-0 bottom-0 left-0 z-0 inline-flex items-center justify-center text-center"
      >
        <span>{{ caption }}</span>
      </span>
    </slot>
  </AvatarRoot>
</template>

<script lang="ts" setup>
// --- external
import { AvatarRoot, AvatarImage } from "radix-vue";
import { computed } from "vue";
// --- internal
// --- components
import { Icon } from "../icon";
import IconAnimated from "../icon-animated/IconAnimated.ce.vue";
import config from "./avatar.config";
import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";
// --- utils
import { isEmpty, isString } from "lodash-es";
// --- types
import type { AvatarProps } from ".";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<AvatarProps>(), {
  // --- props
  icon: undefined,
  animatedIcon: undefined,
  src: "",
  caption: "",
  //  --- styles
  color: "primary",
  fit: "cover",
  shape: "circle",
  size: "xs",

  // --- styles
  uiConfig: () => ({ avatar: [] }),
  class: ""
});

const meta = computed(() => ({
  color: props.color,
  fit: props.fit,
  shape: props.shape,
  size: props.size,
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

const styles = useStyles("avatar", meta, config, props.uiConfig ?? {});
</script>
