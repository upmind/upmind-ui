<template>
  <Ribbon as="footer" background="surface" border="top" v-bind="testAttrs">
    <Container :class="footerStackedRootVariants()">
      <Column
        :class="footerStackedColumnVariants({ isMinimal: meta.isMinimal })"
      >
        <Content gap="none" items="end" :class="footerStackedContentVariants()">
          <section
            v-if="!meta.isMinimal"
            :class="footerStackedTopVariants()"
            aria-label="Language and currency preferences"
          >
            <slot name="footer-actions" />
          </section>

          <section
            :class="
              footerStackedBottomVariants({
                isMinimal: meta.isMinimal,
                showPoweredBy: meta.showPoweredBy
              })
            "
          >
            <slot name="footer-content" />
            <slot name="footer-copyright" />
          </section>
        </Content>
      </Column>
    </Container>
  </Ribbon>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useTestAttrs } from "@upmind/ui";
import Column from "../../layout/components/column/Column.vue";
import Container from "../../layout/components/container/Container.vue";
import Content from "../../layout/components/content/Content.vue";
import Ribbon from "../../layout/components/ribbon/Ribbon.vue";
import { useFooter } from "../useFooter";
import {
  footerStackedRootVariants,
  footerStackedColumnVariants,
  footerStackedContentVariants,
  footerStackedTopVariants,
  footerStackedBottomVariants
} from "../variants";

// --- components

// --- utils

// --- types

// --- props
const props = defineProps<{
  localeCount: number;
  currencyCount: number;
}>();

const testAttrs = useTestAttrs({ key: "footer" });

const { meta: footerMeta } = useFooter();

const meta = computed(() => ({
  isMinimal: props.localeCount <= 1 && props.currencyCount <= 1,
  showPoweredBy: footerMeta.value.showPoweredBy
}));
</script>
