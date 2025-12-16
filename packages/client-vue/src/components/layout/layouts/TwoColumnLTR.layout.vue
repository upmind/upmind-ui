<template>
  <Ribbon
    :background="isMobile ? RIBBON_BACKGROUND.CANVAS : RIBBON_BACKGROUND.LTR"
    :border="RIBBON_BORDER.NONE"
    :height="RIBBON_HEIGHT.GROW"
  >
    <Container :flow="CONTAINER_FLOW.HORIZONTAL">
      <Column
        :background="
          isMobile ? COLUMN_BACKGROUND.CANVAS : COLUMN_BACKGROUND.SURFACE
        "
        :width="COLUMN_WIDTH.FULL"
      >
        <Content
          :gap="CONTENT_GAP.MD"
          :flow="CONTENT_FLOW.VERTICAL"
          :padding="false"
        >
          <slot name="content-header" />

          <template v-if="meta.hasAsideHeader">
            <slot name="default" />
            <slot name="content" />

            <slot name="navigation" />
            <slot name="controls" />

            <slot v-if="isMobile" name="aside" />
          </template>
        </Content>
      </Column>

      <Column :show="COLUMN_SHOW.LG" :background="COLUMN_BACKGROUND.CANVAS">
        <Content :width="CONTENT_WIDTH.ASIDE">
          <slot name="aside-header" />
        </Content>
        <Content
          v-if="meta.hasAsideHeader && meta.hasAside"
          as="aside"
          :width="CONTENT_WIDTH.ASIDE"
          :sticky="CONTENT_STICKY.TOP"
        >
          <slot name="aside" />
        </Content>
      </Column>
    </Container>
  </Ribbon>

  <Ribbon
    v-if="!meta.hasAsideHeader"
    :background="RIBBON_BACKGROUND.LTR"
    :height="RIBBON_HEIGHT.GROW"
  >
    <Container :flow="CONTAINER_FLOW.HORIZONTAL">
      <Column
        :background="COLUMN_BACKGROUND.SURFACE"
        :width="COLUMN_WIDTH.FULL"
      >
        <Content :gap="CONTENT_GAP.MD" :flow="CONTENT_FLOW.VERTICAL">
          <slot name="default" />
          <slot name="content" />

          <slot name="navigation" />
          <slot name="controls" />

          <slot v-if="isMobile" name="aside" />
        </Content>
      </Column>

      <Column
        v-if="meta.hasAside && !isMobile"
        :background="COLUMN_BACKGROUND.CANVAS"
      >
        <Content
          as="aside"
          :width="CONTENT_WIDTH.ASIDE"
          :sticky="CONTENT_STICKY.TOP"
        >
          <slot name="aside" />
        </Content>
      </Column>
    </Container>
  </Ribbon>

  <TwoColumnSticky>
    <template #content-footer>
      <slot name="content-footer" />
    </template>
    <template #aside-footer>
      <slot name="aside-footer" />
    </template>
  </TwoColumnSticky>
</template>

<script lang="ts" setup>
// --- external
import { computed, useSlots } from "vue";

// --- components
import Ribbon from "../components/ribbon/Ribbon.vue";
import Container from "../components/container/Container.vue";
import Column from "../components/column/Column.vue";
import Content from "../components/content/Content.vue";
import TwoColumnSticky from "../components/TwoColumnSticky.vue";

// --- types
import { CONTAINER_FLOW } from "../components/container";
import {
  CONTENT_GAP,
  CONTENT_FLOW,
  CONTENT_WIDTH,
  CONTENT_STICKY
} from "../components/content";
import {
  COLUMN_BACKGROUND,
  COLUMN_WIDTH,
  COLUMN_SHOW
} from "../components/column";
import {
  RIBBON_BACKGROUND,
  RIBBON_HEIGHT,
  RIBBON_BORDER
} from "../components/ribbon";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";
import { isEmptySlot } from "@upmind-automation/upmind-ui";

defineOptions({
  inheritAttrs: false
});

const slots = useSlots();

const meta = computed(() => ({
  // We require the aside on desktop otherwise the two column layout will break
  hasAside: !isEmptySlot("aside", slots) || !isMobile.value,
  hasAsideHeader: !isEmptySlot("aside-header", slots) && !isMobile.value
}));
</script>
