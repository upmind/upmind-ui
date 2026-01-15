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
// --- external
import {
  useSlots,
  computed,
  useTemplateRef,
  ref,
  onMounted,
  nextTick
} from "vue";
import { useMutationObserver } from "@vueuse/core";

// --- utils
import { isEmptySlot } from "@upmind-automation/upmind-ui";

// --- components
import Ribbon from "../components/ribbon/Ribbon.vue";
import Container from "../components/container/Container.vue";
import Column from "../components/column/Column.vue";
import Content from "../components/content/Content.vue";

// --- types
import {
  RIBBON_BACKGROUND,
  RIBBON_STICKY,
  RIBBON_BORDER
} from "../components/ribbon";
import { CONTAINER_FLOW, CONTAINER_ITEMS } from "../components/container";
import {
  COLUMN_WIDTH,
  COLUMN_FLOW,
  COLUMN_ITEMS,
  COLUMN_JUSTIFY
} from "../components/column";
import { every, isEmpty } from "lodash-es";

// ----------------------------------------------------------------------------
const slots = useSlots();

const content = useTemplateRef("content");
const visible = ref(false);

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

/**
 * Checks if a given node has any significant, non-comment, non-empty children.
 * @param node The DOM node to check.
 * @returns True if the node is effectively empty, false otherwise.
 */
const hasSignificantContent = (node: Node): boolean => {
  // Node types: 1 (Element), 3 (Text), 8 (Comment)
  if (node.nodeType === Node.COMMENT_NODE) {
    return false;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    // Check if text content is more than just whitespace
    return !isEmpty(node?.textContent?.trim());
  }

  // If it's an element, recursively check its children
  if (node.nodeType === Node.ELEMENT_NODE) {
    for (const childNode of Array.from(node.childNodes)) {
      if (hasSignificantContent(childNode)) {
        return true;
      }
    }
    // Check if the element itself has non-empty text content (e.g., if targetElement has "Hello")
    return !isEmpty(node?.textContent?.trim());
  }

  return false;
};

// --- side effects
useMutationObserver(
  content,
  mutations => {
    visible.value = content.value?.$el
      ? hasSignificantContent(content.value.$el)
      : false;
  },
  {
    childList: true,
    subtree: true
  }
);

// Initial check on mount - needed because MutationObserver doesn't fire
// for content that already exists when the observer starts
onMounted(() => {
  nextTick(() => {
    visible.value = hasSignificantContent(content.value?.$el);
  });
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
