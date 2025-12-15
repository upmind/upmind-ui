<template>
  <Ribbon
    as="header"
    :background="getBackground"
    :border="meta.border"
    :class="`${styles.header.root} ${shouldShow ? 'opacity-100' : 'opacity-0'}`"
    v-show="meta.isVisible"
    :style="shouldShow ? 'transition: opacity 300ms ease-in-out' : ''"
  >
    <Container
      flow="horizontal"
      justify="between"
      :class="styles.header.container"
    >
      <Column
        :background="isMobile ? COLUMN_BACKGROUND.NONE : leftBackground"
        :class="styles.header.left.column"
        :padding="meta.padding"
      >
        <Content
          :justify="meta.justifyLeft"
          :items="meta.items"
          :class="styles.header.left.content"
          flow="horizontal"
        >
          <slot name="branding" v-if="meta.hasContent">
            <HeaderBrand v-if="meta.showLogo" v-bind="props" />
          </slot>
        </Content>
      </Column>

      <Column
        :background="isMobile ? COLUMN_BACKGROUND.NONE : rightBackground"
        :class="styles.header.right.column"
        :padding="meta.padding"
      >
        <Content
          :class="styles.header.right.content"
          :justify="meta.justifyRight"
          :items="meta.items"
          flow="horizontal"
          class="w-full"
        >
          <slot name="actions" v-if="meta.hasActions"></slot>
        </Content>
      </Column>
    </Container>
  </Ribbon>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";

// --- internal
import { useHeader } from "./useHeader";
import config from "./header.config";
import { useStyles, isMobile } from "@upmind-automation/upmind-ui";
import { useRouteTransition } from "../../modules/system/useRouteTransition";

// --- components
import HeaderBrand from "./HeaderBrand.vue";
import Ribbon from "../layout/components/ribbon/Ribbon.vue";
import Container from "../layout/components/container/Container.vue";
import Column from "../layout/components/column/Column.vue";
import Content from "../layout/components/content/Content.vue";
import { RIBBON_BACKGROUND } from "../layout/components/ribbon";
import { COLUMN_BACKGROUND } from "../layout/components/column";

// --- types
import type { ComputedRef } from "vue";
import { HEADER_BACKGROUND } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------
const { meta } = useHeader();

const stylesMeta = computed(() => ({
  background: meta.value.background,
  position: meta.value.position
}));

const props = defineProps<{
  logo?: string;
  storefrontRoute?: RouteLocationAsRelativeGeneric;
}>();

const styles = useStyles(
  ["header", "header.left", "header.right"],
  stylesMeta,
  config
) as ComputedRef<{
  header: {
    root: string;
    container: string;
    left: {
      column: string;
      content: string;
    };
    right: {
      column: string;
      content: string;
    };
  };
}>;

const shouldShow = ref(true);

const { onTransition } = useRouteTransition();

onTransition(() => {
  shouldShow.value = false;
  setTimeout(() => {
    shouldShow.value = true;
  }, 1);
});

const getBackground = computed(() => {
  if (
    (meta.value.background === HEADER_BACKGROUND.LTR ||
      meta.value.background === HEADER_BACKGROUND.RTL) &&
    isMobile.value
  ) {
    return RIBBON_BACKGROUND.CANVAS;
  } else {
    return meta.value.background;
  }
});

const leftBackground = computed(() => {
  return meta.value.background === HEADER_BACKGROUND.LTR
    ? COLUMN_BACKGROUND.SURFACE
    : COLUMN_BACKGROUND.NONE;
});

const rightBackground = computed(() => {
  return meta.value.background === HEADER_BACKGROUND.RTL
    ? COLUMN_BACKGROUND.SURFACE
    : COLUMN_BACKGROUND.NONE;
});
</script>
