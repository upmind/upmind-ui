<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="isOpen"
    :size="size"
    :skrim="skrim"
    :title="title"
    fit="cover"
    no-close
    no-header
    persistent
  >
    <template #header>
      <div />
    </template>

    <section :class="styles.basket.loading.root">
      <slot name="avatar">
        <Avatar :animated-icon="animatedIcon" color="transparent" size="xl" />
      </slot>

      <slot name="title">
        <h3 :class="styles.basket.loading.title">{{ title }}</h3>
      </slot>

      <slot name="description">
        <p :class="styles.basket.loading.text">{{ text }}</p>
      </slot>

      <footer :class="styles.basket.loading.actions">
        <slot name="footer">
          <Button
            v-if="hasAction"
            v-bind="action"
            @click.stop="doAction"
            :loading="processing"
          >
            <template #prepend>
              <Icon v-if="action?.prependIcon" :icon="action.prependIcon" />
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
import { useBasket } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Avatar, Dialog, Button, Icon } from "@upmind/upwind";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
import type { BasketModalProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketModalProps>(), {
  open: true,
  modal: false,
  skrim: "primary",
  size: "app",
  animatedIcon: {
    icon: "basket",
    primaryColor: "primary",
    secondaryColor: "secondary",
    size: "4xl",
  },
});

const { meta } = useBasket();

const styles = useStyles(["basket.loading"], meta, config);

const processing = ref(false);
const isOpen = computed(() => meta.value.isLoading || props.open);
const hasAction = computed(() => {
  return !isEmpty(props.action);
});

async function doAction() {
  if (isFunction(props.action?.handler)) {
    processing.value = true;
    await props.action.handler();
    processing.value = false;
  }
}
</script>
