<template>
  <Ribbon
    as="footer"
    :background="meta.background"
    :class="styles.footer.flat.root"
  >
    <Container
      flow="horizontal"
      :justify="meta.hasContent || meta.reverse ? 'between' : 'end'"
      items="end"
      :class="styles.footer.flat.container"
    >
      <Column
        :background="leftBackground"
        :class="styles.footer.flat.left.column"
        :justify="meta.justifyLeft"
      >
        <Content
          :class="styles.footer.flat.left.content"
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
        :class="styles.footer.flat.right.column"
        flow="horizontal"
      >
        <Content
          :class="styles.footer.flat.right.content"
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
import { useStyles } from "@upmind-automation/upmind-ui";
import Column from "../../layout/components/column/Column.vue";
import Container from "../../layout/components/container/Container.vue";
import Content from "../../layout/components/content/Content.vue";
import Ribbon from "../../layout/components/ribbon/Ribbon.vue";
import config from "../footer.config";
import { FOOTER_BACKGROUND } from "../types";
import { useFooter } from "../useFooter";

// --- components

// --- utils

// --- types

const { meta } = useFooter();

const stylesMeta = computed(() => ({
  position: meta.value.position,
  background: meta.value.background,
  items: meta.value.items
}));

const styles = useStyles(
  ["footer.flat", "footer.flat.left", "footer.flat.right"],
  stylesMeta,
  config,
  {}
);

const leftBackground = computed(() => {
  return meta.value.background === FOOTER_BACKGROUND.LTR ? "surface" : "none";
});

const rightBackground = computed(() => {
  return meta.value.background === FOOTER_BACKGROUND.RTL ? "surface" : "none";
});
</script>
