<template>
  <component
    v-if="modal || (!modal && meta.isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="meta.isOpen"
    :size="size"
    :title="title"
    :fit="fit"
    :to="to"
    no-header
    :dismissable="false"
  >
    <div :class="cn(styles.interstitial.root, props.class)">
      <slot name="avatar">
        <Avatar :animated-icon="animatedIcon" class="size-36 bg-transparent" />
      </slot>

      <section :class="styles.interstitial.section">
        <h3 :class="styles.interstitial.title">
          <slot name="title"
            ><Sanitized v-if="title" :modelValue="title"
          /></slot>
        </h3>

        <p :class="styles.interstitial.text">
          <slot name="text"><Sanitized v-if="text" :modelValue="text" /></slot>
        </p>

        <slot></slot>
      </section>

      <footer :class="styles.interstitial.actions">
        <slot name="actions">
          <Button
            v-for="(action, index) in actions"
            :key="`action-${index}`"
            size="lg"
            v-bind="action"
            :loading="meta.isProcessing"
            :variant="action?.variant || 'solid'"
            :color="action?.color || 'primary'"
            @click.stop="doAction(action?.handler)"
            pill
          />
        </slot>
      </footer>
    </div>
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
import Sanitized from "../sanitized/Sanitized.vue";

// --- utils
import { isFunction } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { InterstitialActionProps, InterstitialProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: false,
  size: "2xl",
  fit: "contain",
  animatedIcon: () => ({
    icon: "basket",
    delay: 5000,
    primaryColor: "primary",
    secondaryColor: "secondary",
    size: "4xl"
  })
});

const processing = ref(false);
const meta = computed(() => ({
  isProcessing: processing.value,
  isOpen: props.open,
  isModal: props.modal
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
    actions: string;
    section: string;
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
