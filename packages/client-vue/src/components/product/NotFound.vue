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

    <section :class="styles.product.notFound.root">
      <Avatar :animated-icon="animatedIcon" color="transparent" size="xl" />

      <h3 :class="styles.product.notFound.title">{{ title }}</h3>

      <p :class="styles.product.notFound.text">{{ text }}</p>

      <footer :class="styles.product.notFound.actions">
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
import type { ProductModalProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductModalProps>(), {
  open: true,
  modal: false,
  skrim: "primary",
  size: "app",
  animatedIcon: {
    icon: "basket",
    delay: 5000,
    primaryColor: "primary",
    secondaryColor: "secondary",
    size: "4xl",
  },
});

const { meta } = useBasket();

const styles = useStyles(["product.notFound"], meta, config);

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
