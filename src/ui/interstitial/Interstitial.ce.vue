<template>
  <component
    v-if="modal || (!modal && meta.isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="meta.isOpen"
    :size="size"
    :skrim="skrim"
    :title="title"
    :fit="fit"
    to="main"
    no-header
    :dismissable="false"
  >
    <section :class="cn(styles.interstitial.root, props.class)">
      <slot name="avatar">
        <Avatar :animated-icon="animatedIcon" color="transparent" size="xl" />
      </slot>

      <h3 :class="styles.interstitial.title">
        <slot name="title">{{ title }}</slot>
      </h3>

      <p :class="styles.interstitial.text">
        <slot name="text">{{ text }}</slot>
      </p>

      <div v-if="!!$slots.default" :class="styles.interstitial.content">
        <slot></slot>
      </div>

      <footer :class="styles.interstitial.actions">
        <slot name="actions">
          <Button
            v-for="(action, index) in actions"
            :key="`action-${index}`"
            v-bind="action"
            :loading="meta.isProcessing"
            @click.stop="doAction(action?.handler)"
          >
            <template #prepend>
              <Icon v-if="action?.prependIcon" v-bind="action.prependIcon" />
            </template>
            <template #append>
              <Icon v-if="action?.appendIcon" v-bind="action.appendIcon" />
            </template>
          </Button>
        </slot>
      </footer>
    </section>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./interstitial.config";

// --- components
import { Dialog } from "../dialog";
import { Button } from "../button";
import { Avatar } from "../avatar";
import { Icon } from "../icon";

// --- utils
import { isFunction } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { InterstitialActionProps, InterstitialProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: false,
  skrim: "light",
  size: "2xl",
  fit: "contain",
  animatedIcon: () => ({
    icon: "basket",
    delay: 5000,
    primaryColor: "primary",
    secondaryColor: "secondary",
    size: "4xl",
  }),
});

const processing = ref(false);
const meta = computed(() => ({
  isProcessing: processing.value,
  isOpen: props.open,
}));

const styles = useStyles(
  "interstitial",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  interstitial: {
    root: string;
    title: string;
    text: string;
    content: string;
    actions: string;
  };
}>;

async function doAction(handler: InterstitialActionProps["handler"]) {
  if (isFunction(handler)) {
    processing.value = true;
    await handler();
    processing.value = false;
  }
}
</script>
