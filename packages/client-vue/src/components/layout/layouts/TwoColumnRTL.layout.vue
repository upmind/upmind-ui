<template>
  <Root class="layout-fit">
    <Ribbon
      :background="isMobile ? RIBBON_BACKGROUND.CANVAS : RIBBON_BACKGROUND.RTL"
      :height="RIBBON_HEIGHT.GROW"
      :border="RIBBON_BORDER.NONE"
      :style="{ minHeight: `calc(100vh - 6rem - ${bottomOffset})` }"
    >
      <Container :flow="CONTAINER_FLOW.HORIZONTAL">
        <Column class="flex-1" :background="COLUMN_BACKGROUND.CANVAS">
          <div class="flex min-h-0 flex-1 flex-col">
            <Content :width="CONTENT_WIDTH.ASIDE" :gap="CONTENT_GAP.SM">
              <slot name="content-header" />
            </Content>
            <Content
              v-if="!isMobile && meta.hasNavigation && meta.hasControls"
              :flow="CONTENT_FLOW.NONE"
              class=""
            >
              <slot name="navigation" />
              <slot name="controls" />
            </Content>
            <div
              v-if="!isMobile && meta.hasAside"
              class="flex min-h-0 flex-1 flex-col"
            >
              <Content
                as="aside"
                :width="CONTENT_WIDTH.ASIDE"
                :style="{ bottom: bottomOffset }"
                class="mt-auto lg:sticky"
              >
                <slot name="aside" />
              </Content>
            </div>
          </div>
        </Column>

        <Column
          :background="COLUMN_BACKGROUND.SURFACE"
          :width="COLUMN_WIDTH.FULL"
        >
          <Content :gap="CONTENT_GAP.MD" :flow="CONTENT_FLOW.VERTICAL">
            <slot name="default" />
            <slot name="content" />

            <template v-if="isMobile">
              <slot name="aside-footer" />
              <slot name="content-footer" />
              <slot name="aside" />
            </template>
          </Content>
        </Column>
      </Container>
    </Ribbon>

    <TwoColumnSticky v-if="!isMobile" ref="stickyFooterRef" reverse>
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
import { useElementSize } from "@vueuse/core";
import { ref, computed } from "vue";
import { isMobile } from "../../../composables/isMobile";
import { isEmptySlot } from "../../../utils/isEmptySlot";
import { COLUMN_BACKGROUND, COLUMN_WIDTH } from "../components/column";
import Column from "../components/column/Column.vue";
import { CONTAINER_FLOW } from "../components/container";
import Container from "../components/container/Container.vue";
import {
  CONTENT_GAP,
  CONTENT_FLOW,
  CONTENT_WIDTH
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

const stickyFooterRef = ref<InstanceType<typeof TwoColumnSticky> | null>(null);

const stickyFooterEl = computed(() => stickyFooterRef.value?.el ?? null);

const { height: stickyFooterHeight } = useElementSize(stickyFooterEl);

const bottomOffset = computed(() => {
  return `${stickyFooterHeight.value || 0}px`;
});

const slots = useSlots();

const meta = computed(() => ({
  // We require the aside on desktop otherwise the two column layout will break
  hasAside: !isEmptySlot("aside", slots) || !isMobile.value,
  hasNavigation: !isEmptySlot("navigation", slots),
  hasControls: !isEmptySlot("controls", slots)
}));
</script>
