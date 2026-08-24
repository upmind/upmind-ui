<template>
  <Ribbon
    as="header"
    :background="getBackground"
    :border="meta.border"
    :class="
      headerRootVariants({
        position: meta.position,
        visible: shouldShow
      })
    "
    v-show="meta.isVisible"
  >
    <Container
      flow="horizontal"
      justify="between"
      :class="headerContainerVariants()"
    >
      <Column
        :background="isMobile ? COLUMN_BACKGROUND.NONE : leftBackground"
        :class="headerLeftColumnVariants({ background: meta.background })"
        :padding="meta.padding"
      >
        <Content
          :justify="meta.justifyLeft"
          :items="meta.items"
          :class="headerLeftContentVariants({ background: meta.background })"
          flow="horizontal"
        >
          <slot name="branding" v-if="meta.hasContent">
            <HeaderBrand v-if="meta.showLogo" v-bind="props" />
          </slot>
        </Content>
      </Column>

      <Column
        :background="isMobile ? COLUMN_BACKGROUND.NONE : rightBackground"
        :class="headerRightColumnVariants({ background: meta.background })"
        :padding="meta.padding"
      >
        <Content
          :class="headerRightContentVariants({ background: meta.background })"
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
import { computed, ref } from "vue";
import { isMobile } from "../../composables/isMobile";
import { useRouteTransition } from "../../modules/system/useRouteTransition";
import { COLUMN_BACKGROUND } from "../layout/components/column";
import Column from "../layout/components/column/Column.vue";
import Container from "../layout/components/container/Container.vue";
import Content from "../layout/components/content/Content.vue";
import { RIBBON_BACKGROUND } from "../layout/components/ribbon";
import Ribbon from "../layout/components/ribbon/Ribbon.vue";
import HeaderBrand from "./HeaderBrand.vue";
import { HEADER_BACKGROUND } from "./types";
import { useHeader } from "./useHeader";
import {
  headerRootVariants,
  headerContainerVariants,
  headerLeftColumnVariants,
  headerLeftContentVariants,
  headerRightColumnVariants,
  headerRightContentVariants
} from "./variants";
import type { StorefrontRoute } from "../../types";

// -----------------------------------------------------------------------------
const { meta } = useHeader();

const props = defineProps<{
  logo?: string;
  storefrontRoute?: StorefrontRoute;
}>();

const shouldShow = ref(true);

const { onTransition } = useRouteTransition();

/**
 * Handle route transitions to avoid header flicker
 * We FORCE the header to re-render on route change
 * to sync with the page transition
 * NB: nexttick did not work here
 */
onTransition(_value => {
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
  if (meta.value.background === HEADER_BACKGROUND.SURFACE) {
    return COLUMN_BACKGROUND.SURFACE;
  }

  return meta.value.background === HEADER_BACKGROUND.LTR
    ? COLUMN_BACKGROUND.SURFACE
    : COLUMN_BACKGROUND.CANVAS;
});

const rightBackground = computed(() => {
  if (meta.value.background === HEADER_BACKGROUND.SURFACE) {
    return COLUMN_BACKGROUND.SURFACE;
  }

  return meta.value.background === HEADER_BACKGROUND.RTL
    ? COLUMN_BACKGROUND.SURFACE
    : COLUMN_BACKGROUND.CANVAS;
});
</script>
