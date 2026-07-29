<template>
  <!-- Mirrors TwoColumnLTR's structure for stable sizing; canvas backgrounds
       and a Back row instead of a content-header. -->
  <Root class="layout-fit">
    <Ribbon :background="RIBBON_BACKGROUND.CANVAS" :border="RIBBON_BORDER.NONE">
      <Container
        :flow="CONTAINER_FLOW.HORIZONTAL"
        :justify="centered ? CONTAINER_JUSTIFY.CENTER : CONTAINER_JUSTIFY.NONE"
      >
        <!-- Strip the Column's default vertical padding (both breakpoints) so the
             back row is compact; on the first step (no Back) it would otherwise
             reserve a large empty gap above the content. Spacing lives on Content. -->
        <Column
          :background="COLUMN_BACKGROUND.CANVAS"
          :width="centered ? COLUMN_WIDTH.AUTO : COLUMN_WIDTH.FULL"
          :class="styles.inset.backColumn"
        >
          <Content
            :flow="CONTENT_FLOW.VERTICAL"
            :justify="CONTENT_JUSTIFY.END"
            :class="styles.inset.backContent"
          >
            <!-- Two-column: Back sits in this full-width row. Centered: it moves
                 into the content column below so it aligns to the card's left
                 edge rather than centring. -->
            <slot v-if="!centered" name="back" />
          </Content>
        </Column>
      </Container>
    </Ribbon>

    <!-- Optional full-width row above the two-column area (e.g. a product hero
         on the configure step). Only renders when a step provides it. -->
    <Ribbon
      v-if="$slots.header"
      :background="RIBBON_BACKGROUND.CANVAS"
      :border="RIBBON_BORDER.NONE"
    >
      <Container
        :flow="CONTAINER_FLOW.HORIZONTAL"
        :justify="centered ? CONTAINER_JUSTIFY.CENTER : CONTAINER_JUSTIFY.NONE"
      >
        <Column
          :background="COLUMN_BACKGROUND.CANVAS"
          :width="centered ? COLUMN_WIDTH.AUTO : COLUMN_WIDTH.FULL"
          :class="styles.inset.headerColumn"
        >
          <Content :gap="CONTENT_GAP.SM" :flow="CONTENT_FLOW.VERTICAL">
            <slot name="header" />
          </Content>
        </Column>
      </Container>
    </Ribbon>

    <Ribbon
      :background="RIBBON_BACKGROUND.CANVAS"
      :border="RIBBON_BORDER.NONE"
      :height="RIBBON_HEIGHT.GROW"
    >
      <Container
        :flow="CONTAINER_FLOW.HORIZONTAL"
        :justify="centered ? CONTAINER_JUSTIFY.CENTER : CONTAINER_JUSTIFY.NONE"
      >
        <!-- Centered: a fixed-width, centred column so both auth cards match
             regardless of form length. Two-column: full width with its inner
             (right) padding dropped so the card sits close to the aside. -->
        <Column
          :background="COLUMN_BACKGROUND.CANVAS"
          :width="COLUMN_WIDTH.FULL"
          :class="styles.inset.contentColumn"
        >
          <Content
            :gap="CONTENT_GAP.SM"
            :flow="CONTENT_FLOW.VERTICAL"
            :class="styles.inset.content"
          >
            <slot v-if="centered" name="back" />
            <slot name="content" />
          </Content>
        </Column>

        <!-- Drop the aside's inner (left) padding so the summary sits close to
             the content; the outer (right) padding stays as the page margin. -->
        <Column
          v-if="meta.showAside"
          :background="COLUMN_BACKGROUND.CANVAS"
          :class="styles.inset.aside"
        >
          <Content
            as="aside"
            :width="CONTENT_WIDTH.ASIDE"
            :sticky="CONTENT_STICKY.TOP"
            :gap="CONTENT_GAP.SM"
          >
            <slot name="aside" />
          </Content>
        </Column>
      </Container>
    </Ribbon>
  </Root>
</template>

<script lang="ts" setup>
// --- external
import { computed, onMounted } from "vue";

// --- internal
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../header/useHeader";
import { useFooter } from "../../footer/useFooter";
import config from "../layout.config";

// --- components
import Root from "../components/root/Root.vue";
import Ribbon from "../components/ribbon/Ribbon.vue";
import Container from "../components/container/Container.vue";
import Column from "../components/column/Column.vue";
import Content from "../components/content/Content.vue";

// --- utils
import { isMobile, useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { InsetProps } from "../types";
import { HEADER_BACKGROUND } from "../../header/types";
import { FOOTER_LAYOUT, FOOTER_BACKGROUND } from "../../footer/types";
import {
  RIBBON_BACKGROUND,
  RIBBON_BORDER,
  RIBBON_HEIGHT
} from "../components/ribbon";
import { CONTAINER_FLOW, CONTAINER_JUSTIFY } from "../components/container";
import { COLUMN_BACKGROUND, COLUMN_WIDTH } from "../components/column";
import {
  CONTENT_GAP,
  CONTENT_FLOW,
  CONTENT_WIDTH,
  CONTENT_STICKY,
  CONTENT_JUSTIFY
} from "../components/content";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InsetProps>(), {
  aside: true,
  centered: false
});

defineOptions({
  inheritAttrs: false
});

const meta = computed(() => ({
  showAside: props.aside && !props.centered && !isMobile.value
}));

const styles = useStyles(["inset"], props, config);

const { ui } = useConfig();

// Every step on this layout shares the same minimal chrome: a canvas header aligned to
// the end (logo + Login/avatar) and a flat canvas footer.
onMounted(() => {
  useHeader({
    background: HEADER_BACKGROUND.CANVAS,
    border: "none",
    items: "end",
    noBasket: ui.basketAction.isHidden
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.CANVAS,
    items: "end",
    justifyRight: "start"
  });
});
</script>
