<template>
  <Transition name="footer">
    <Ribbon
      v-if="
        !isEmptySlot('content-footer', slots) ||
        !isEmptySlot('aside-footer', slots)
      "
      :ref="(el: any) => (rootEl = el?.$el ?? null)"
      :sticky="RIBBON_STICKY.BOTTOM"
      :background="RIBBON_BACKGROUND.SURFACE"
      :border="RIBBON_BORDER.TOP"
      class="z-20"
      v-show="visible"
    >
      <Container
        :flow="CONTAINER_FLOW.HORIZONTAL"
        :items="CONTAINER_ITEMS.CENTER"
      >
        <template v-if="!reverse">
          <Column
            class="hidden py-7 lg:block lg:py-7"
            :width="COLUMN_WIDTH.FULL"
          >
            <Content class="w-full py-0 lg:py-0" ref="content">
              <slot name="content-footer" />
            </Content>
          </Column>
          <Column class="py-7 lg:py-7">
            <Content
              as="aside"
              class="py-0 lg:py-0"
              :width="CONTENT_WIDTH.ASIDE"
            >
              <slot name="aside-footer" />
            </Content>
          </Column>
        </template>

        <template v-else>
          <Column class="hidden py-7 lg:block lg:py-7">
            <Content
              as="aside"
              class="py-0 lg:py-0"
              :width="CONTENT_WIDTH.ASIDE"
            >
              <slot name="aside-footer" />
            </Content>
          </Column>
          <Column class="py-7 lg:py-7" :width="COLUMN_WIDTH.FULL">
            <Content class="w-full py-0 lg:py-0" ref="content">
              <slot name="content-footer" />
            </Content>
          </Column>
        </template>
      </Container>
    </Ribbon>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from "vue";
import { useSlots } from "@upmind/ui";
import { isEmptySlot } from "../../../utils/isEmptySlot";
import { COLUMN_WIDTH } from "../components/column";
import Column from "../components/column/Column.vue";
import { CONTAINER_FLOW, CONTAINER_ITEMS } from "../components/container";
import Container from "../components/container/Container.vue";
import { CONTENT_WIDTH } from "../components/content";
import Content from "../components/content/Content.vue";
import {
  RIBBON_BACKGROUND,
  RIBBON_STICKY,
  RIBBON_BORDER
} from "../components/ribbon";
import Ribbon from "../components/ribbon/Ribbon.vue";
import { useContentVisibility } from "../useContentVisibility";

// ----------------------------------------------------------------------------

defineProps<{
  reverse?: boolean;
}>();

const slots = useSlots();

const content = useTemplateRef("content");
const visible = useContentVisibility(content);
const rootEl = ref<HTMLElement | null>(null);

// Expose as a getter so parent can access the sticky ribbon reactively
defineExpose({
  get el() {
    return rootEl.value;
  }
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
