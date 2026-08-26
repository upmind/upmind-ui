<template>
  <Root class="layout-fit">
    <Ribbon
      :background="isMobile ? RIBBON_BACKGROUND.CANVAS : RIBBON_BACKGROUND.LTR"
      :border="RIBBON_BORDER.NONE"
    >
      <Container :flow="CONTAINER_FLOW.HORIZONTAL">
        <Column
          :background="
            isMobile ? COLUMN_BACKGROUND.CANVAS : COLUMN_BACKGROUND.SURFACE
          "
          :width="COLUMN_WIDTH.FULL"
        >
          <Content
            :gap="CONTENT_GAP.LG"
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

        <Column
          as="aside"
          :show="COLUMN_SHOW.LG"
          :background="COLUMN_BACKGROUND.CANVAS"
        >
          <Content
            :width="CONTENT_WIDTH.ASIDE"
            :gap="CONTENT_GAP.LG"
            :sticky="!meta.hasAside ? CONTENT_STICKY.TOP : CONTENT_STICKY.NONE"
          >
            <slot name="aside-header" />
          </Content>
          <Content
            v-if="meta.hasAsideHeader && meta.hasAside"
            :width="CONTENT_WIDTH.ASIDE"
            :sticky="CONTENT_STICKY.TOP"
            :gap="CONTENT_GAP.LG"
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
          class="lg:pt-0"
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
          v-if="!isMobile"
          :background="COLUMN_BACKGROUND.CANVAS"
          class="lg:pt-0"
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
  </Root>
</template>

<script lang="ts" setup>
import { useSlots } from "@upmind/ui";
import { computed } from "vue";
import { isMobile } from "../../../composables/isMobile";
import { isEmptySlot } from "../../../utils/isEmptySlot";
import {
  COLUMN_BACKGROUND,
  COLUMN_WIDTH,
  COLUMN_SHOW
} from "../components/column";
import Column from "../components/column/Column.vue";
import { CONTAINER_FLOW } from "../components/container";
import Container from "../components/container/Container.vue";
import {
  CONTENT_GAP,
  CONTENT_FLOW,
  CONTENT_WIDTH,
  CONTENT_STICKY
} from "../components/content";
import Content from "../components/content/Content.vue";
import {
  RIBBON_BACKGROUND,
  RIBBON_HEIGHT,
  RIBBON_BORDER
} from "../components/ribbon";
import Ribbon from "../components/ribbon/Ribbon.vue";
import Root from "../components/root/Root.vue";
import TwoColumnSticky from "../components/TwoColumnSticky.vue";
import type { VariantProps } from "../types";

defineOptions({
  inheritAttrs: false
});

defineProps<VariantProps>();

const slots = useSlots();

const meta = computed(() => ({
  // We require the aside on desktop otherwise the two column layout will break
  hasAside: !isEmptySlot("aside", slots),
  hasAsideHeader: !isEmptySlot("aside-header", slots) && !isMobile.value
}));
</script>
