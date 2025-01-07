<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="isOpen"
    :size="size"
    :skrim="skrim"
    :title="title"
    :fit="fit"
    to="main"
    no-header
    :dismissable="false"
  >
    <section :class="cn(variants.interstitial.root, props.class)">
      <slot name="avatar">
        <Avatar :animated-icon="animatedIcon" color="transparent" size="xl" />
      </slot>

      <h3 :class="variants.interstitial.title">
        <slot name="title">{{ title }}</slot>
      </h3>

      <p :class="variants.interstitial.text">
        <slot name="text">{{ text }}</slot>
      </p>

      <div v-if="!!$slots.default" :class="variants.interstitial.content">
        <slot></slot>
      </div>

      <footer :class="variants.interstitial.actions">
        <Button
          v-for="(action, index) in actions"
          :key="`action-${index}`"
          v-bind="action"
          :loading="processing"
          @click.stop="doAction(action?.handler)"
        >
          <template #prepend>
            <Icon v-if="action?.prependIcon" v-bind="action.prependIcon" />
          </template>
          <template #append>
            <Icon v-if="action?.appendIcon" v-bind="action.appendIcon" />
          </template>
        </Button>
      </footer>
    </section>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upwind";
import config from "./interstitial.config";

// --- components
import { Dialog, Button, Avatar, Icon } from "@upmind-automation/upwind";

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

const { meta } = useBasket();

const variants = useStyles(
  "interstitial",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  interstitial: {
    root: string;
    title: string;
    text: string;
    content: string;
    actions: string;
  };
}>;

const processing = ref(false);
const isOpen = computed(() => meta.value.isEmpty || props.open);

async function doAction(handler: InterstitialActionProps["handler"]) {
  if (isFunction(handler)) {
    processing.value = true;
    await handler();
    processing.value = false;
  }
}
</script>
