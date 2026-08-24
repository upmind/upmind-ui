<template>
  <Ribbon
    as="footer"
    :background="meta.background"
    :class="footerFlatRootVariants({ position: meta.position })"
  >
    <Container
      flow="horizontal"
      :justify="meta.hasContent || meta.reverse ? 'between' : 'end'"
      items="end"
      :class="footerFlatContainerVariants()"
    >
      <Column
        :background="leftBackground"
        :class="footerFlatLeftColumnVariants({ background: meta.background })"
        :justify="meta.justifyLeft"
      >
        <Content
          :class="
            footerFlatLeftContentVariants({ background: meta.background })
          "
          :items="meta.items"
          justify="between"
          flow="horizontal"
        >
          <template v-if="!meta.reverse">
            <slot name="footer-copyright" />

            <div class="flex gap-2">
              <slot name="footer-actions" />
            </div>
          </template>

          <template v-else>
            <slot name="footer-content" />
          </template>
        </Content>
      </Column>

      <Column
        :background="rightBackground"
        :class="footerFlatRightColumnVariants({ background: meta.background })"
        flow="horizontal"
      >
        <Content
          :class="
            footerFlatRightContentVariants({ background: meta.background })
          "
          :items="meta.items"
          :justify="meta.justifyRight"
          flow="horizontal"
        >
          <template v-if="!meta.reverse">
            <slot name="footer-content" />
          </template>

          <template v-else>
            <slot name="footer-copyright" />

            <div class="flex gap-2">
              <slot name="footer-actions" />
            </div>
          </template>
        </Content>
      </Column>
    </Container>
  </Ribbon>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Column from "../../layout/components/column/Column.vue";
import Container from "../../layout/components/container/Container.vue";
import Content from "../../layout/components/content/Content.vue";
import Ribbon from "../../layout/components/ribbon/Ribbon.vue";
import { FOOTER_BACKGROUND } from "../types";
import { useFooter } from "../useFooter";
import {
  footerFlatRootVariants,
  footerFlatContainerVariants,
  footerFlatLeftColumnVariants,
  footerFlatLeftContentVariants,
  footerFlatRightColumnVariants,
  footerFlatRightContentVariants
} from "../variants";

// --- components

// --- utils

// --- types

const { meta } = useFooter();

const leftBackground = computed(() => {
  return meta.value.background === FOOTER_BACKGROUND.LTR ? "surface" : "none";
});

const rightBackground = computed(() => {
  return meta.value.background === FOOTER_BACKGROUND.RTL ? "surface" : "none";
});
</script>
