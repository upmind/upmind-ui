<template>
  <Root>
    <Ribbon
      v-if="meta.hasContentHeader"
      :background="RIBBON_BACKGROUND.SURFACE"
    >
      <Container>
        <Column :class="meta.hasTabs ? 'pb-0 lg:pb-0' : ''">
          <Content
            :class="meta.hasTabs ? 'pb-0 lg:pb-0' : ''"
            :gap="meta.hasTabs ? CONTENT_GAP.SM : CONTENT_GAP.MD"
          >
            <slot name="content-header" />

            <slot name="tabs" />
          </Content>
        </Column>
      </Container>
    </Ribbon>

    <Ribbon v-if="meta.hasControls" :background="RIBBON_BACKGROUND.SURFACE">
      <Container>
        <Column class="py-4 lg:py-4">
          <Content
            :flow="CONTENT_FLOW.HORIZONTAL"
            :justify="CONTENT_JUSTIFY.BETWEEN"
            :padding="false"
          >
            <slot name="controls" />
            <slot name="navigation" />
            <slot name="actions" />
          </Content>
        </Column>
      </Container>
    </Ribbon>

    <Ribbon
      v-if="meta.hasContent"
      :background="RIBBON_BACKGROUND.CANVAS"
      class="border-0"
    >
      <Container>
        <Column :flow="COLUMN_FLOW.HORIZONTAL">
          <Content :width="CONTENT_WIDTH.FULL">
            <slot name="default" />
            <slot name="content" />
          </Content>

          <Content
            v-if="meta.hasAside"
            as="aside"
            :width="card ? CONTENT_WIDTH.ASIDELG : CONTENT_WIDTH.ASIDE"
            :sticky="CONTENT_STICKY.TOP"
            :gap="card ? CONTENT_GAP.SM : CONTENT_GAP.MD"
            :height="CONTENT_HEIGHT.FULL"
          >
            <slot name="aside" />
          </Content>
        </Column>
      </Container>
    </Ribbon>

    <SingleColumnSticky>
      <template #content-footer>
        <slot name="content-footer" />
      </template>
      <template #aside-footer>
        <slot name="aside-footer" />
      </template>
    </SingleColumnSticky>
  </Root>
</template>

<script lang="ts" setup>
import { useSlots } from "@upmind/ui";
import { computed } from "vue";
import { isEmptySlot } from "../../../utils/isEmptySlot";
import { useSection } from "../../section/useSection";
import { COLUMN_FLOW } from "../components/column";
import Column from "../components/column/Column.vue";
import Container from "../components/container/Container.vue";
import {
  CONTENT_WIDTH,
  CONTENT_FLOW,
  CONTENT_JUSTIFY,
  CONTENT_STICKY,
  CONTENT_GAP,
  CONTENT_HEIGHT
} from "../components/content";
import Content from "../components/content/Content.vue";
import { RIBBON_BACKGROUND } from "../components/ribbon";
import Ribbon from "../components/ribbon/Ribbon.vue";
import Root from "../components/root/Root.vue";
import SingleColumnSticky from "../components/SingleColumnSticky.vue";
import type { VariantProps } from "../types";

const props = defineProps<VariantProps>();

const slots = useSlots();

const { card } = useSection();

const meta = computed(() => ({
  variant: "full",
  hasContentHeader: !isEmptySlot("content-header", slots),
  hasContent: !isEmptySlot("default", slots) || !isEmptySlot("content", slots),
  hasFooter: !isEmptySlot("footer", slots),
  hasTabs: !isEmptySlot("tabs", slots),
  isMinimal: props.minimal,
  hasControls:
    !isEmptySlot("controls", slots) ||
    !isEmptySlot("navigation", slots) ||
    !isEmptySlot("actions", slots),
  hasAside: !isEmptySlot("aside", slots)
}));
</script>
