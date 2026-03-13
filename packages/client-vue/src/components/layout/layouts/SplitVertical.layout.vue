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

    <Ribbon v-if="meta.hasContent" :background="RIBBON_BACKGROUND.CANVAS">
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
// --- utils
import { isEmptySlot } from "@upmind-automation/upmind-ui";

// --- components
import Root from "../components/root/Root.vue";
import Ribbon from "../components/ribbon/Ribbon.vue";
import Container from "../components/container/Container.vue";
import Column from "../components/column/Column.vue";
import Content from "../components/content/Content.vue";
import SingleColumnSticky from "../components/SingleColumnSticky.vue";

// --- internal
import { useSection } from "../../section/useSection";

// --- types
import { computed, useSlots } from "vue";
import { type VariantProps } from "../types";
import { RIBBON_BACKGROUND } from "../components/ribbon";
import { COLUMN_FLOW } from "../components/column";
import {
  CONTENT_WIDTH,
  CONTENT_FLOW,
  CONTENT_JUSTIFY,
  CONTENT_STICKY,
  CONTENT_GAP,
  CONTENT_HEIGHT
} from "../components/content";

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
