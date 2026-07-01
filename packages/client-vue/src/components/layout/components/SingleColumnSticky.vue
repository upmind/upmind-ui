<template>
  <Transition name="footer">
    <Ribbon
      v-if="
        !isEmptySlot('content-footer', slots) ||
        !isEmptySlot('aside-footer', slots)
      "
      :sticky="RIBBON_STICKY.BOTTOM"
      :background="RIBBON_BACKGROUND.SURFACE"
      :border="RIBBON_BORDER.TOP"
      class="z-20"
      as="footer"
      v-show="visible"
    >
      <Container
        :flow="CONTAINER_FLOW.HORIZONTAL"
        :items="CONTAINER_ITEMS.CENTER"
      >
        <Column :width="COLUMN_WIDTH.FULL" class="py-7 lg:py-7">
          <Content
            class="py-0 lg:py-0"
            :flow="COLUMN_FLOW.HORIZONTAL"
            :items="COLUMN_ITEMS.CENTER"
            :justify="justifyDirection"
            ref="content"
          >
            <slot name="aside-footer" />
            <slot name="content-footer" />
          </Content>
        </Column>
      </Container>
    </Ribbon>
  </Transition>
</template>

<script lang="ts" setup>
import { useSlots, computed, useTemplateRef } from "vue";
import { isEmptySlot } from "@upmind-automation/upmind-ui";
import {
  COLUMN_WIDTH,
  COLUMN_FLOW,
  COLUMN_ITEMS,
  COLUMN_JUSTIFY
} from "../components/column";
import Column from "../components/column/Column.vue";
import { CONTAINER_FLOW, CONTAINER_ITEMS } from "../components/container";
import Container from "../components/container/Container.vue";
import Content from "../components/content/Content.vue";
import {
  RIBBON_BACKGROUND,
  RIBBON_STICKY,
  RIBBON_BORDER
} from "../components/ribbon";
import Ribbon from "../components/ribbon/Ribbon.vue";
import { useContentVisibility } from "../useContentVisibility";

// --- components

// --- types

// ----------------------------------------------------------------------------
const slots = useSlots();

const content = useTemplateRef("content");
const visible = useContentVisibility(content);

const justifyDirection = computed(() => {
  if (
    isEmptySlot("aside-footer", slots) &&
    !isEmptySlot("content-footer", slots)
  ) {
    return COLUMN_JUSTIFY.END;
  }

  if (
    !isEmptySlot("aside-footer", slots) &&
    isEmptySlot("content-footer", slots)
  ) {
    return COLUMN_JUSTIFY.START;
  }

  return COLUMN_JUSTIFY.BETWEEN;
});
</script>

<style scoped>
.footer-enter-active,
.footer-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.footer-enter-from,
.footer-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
