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
    to="#vue-app"
    no-close
    no-header
    :dismissable="false"
  >
    <template #header>
      <div />
    </template>

    <section :class="styles.product.notFound.root">
      <Avatar :animated-icon="animatedIcon" color="transparent" size="xl" />

      <h3 :class="styles.product.notFound.title">
        <slot name="title">{{ title }}</slot>
      </h3>

      <p :class="styles.product.notFound.text">
        <slot name="text">{{ text }}</slot>
      </p>

      <footer :class="styles.product.notFound.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
        >
          <template #prepend>
            <Icon
              v-if="action?.prependIcon"
              :icon="action.prependIcon"
              size="2xs"
            />
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
import { useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- components
import { Avatar, Dialog, Button, Icon } from "@upmind-automation/upwind";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ProductModalProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductModalProps>(), {
  open: true,
  modal: false,
  skrim: "primary",
  size: "2xl",
  animatedIcon: {
    icon: "basket",
    delay: 5000,
    primaryColor: "primary",
    secondaryColor: "accent",
    size: "4xl",
  },
});

const { meta } = useBasket();

const styles = useStyles(["product.notFound"], meta, config) as ComputedRef<{
  product: {
    NotFound: {
      root: string;
      title: string;
      text: string;
      actions: string;
    };
  };
}>;

const processing = ref(false);
const isOpen = computed(() => meta.value.isEmpty || props.open);
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
