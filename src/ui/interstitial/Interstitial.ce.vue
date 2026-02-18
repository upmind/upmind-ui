<template>
  <component
    v-if="modal || (!modal && meta.isOpen)"
    :is="modal ? Dialog : 'div'"
    :open="meta.isOpen"
    :size="size"
    :fit="fit"
    :to="to"
    no-header
    :dismissable="false"
  >
    <div :class="cn(styles.interstitial.root, props.class)">
      <slot name="avatar">
        <Avatar
          :animated-icon="animatedIcon"
          class="size-36 overflow-visible bg-transparent"
        />
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

      <footer
        v-if="!isEmptySlot('actions', slots) || !isEmpty(actions)"
        :class="styles.interstitial.actions"
      >
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
          />
        </slot>
      </footer>
    </div>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
import { ref, computed, useSlots } from "vue";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { Dialog } from "../dialog";
import Sanitized from "../sanitized/Sanitized.vue";
import config from "./interstitial.config";
import { useStyles, cn, isEmptySlot } from "../../utils";
import { isEmpty } from "lodash-es";
import { isFunction } from "lodash-es";
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

const slots = useSlots();

const styles = useStyles("interstitial", meta, config, props.uiConfig ?? {});

async function doAction(handler: InterstitialActionProps["handler"]) {
  if (isFunction(handler)) {
    processing.value = true;
    await handler();
    processing.value = false;
  }
}
</script>
