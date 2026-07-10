<template>
  <Ribbon as="footer" background="surface" border="top" v-bind="testAttrs">
    <Container :class="styles.footer.stacked.root">
      <Column :class="styles.footer.stacked.column">
        <Content gap="none" items="end" :class="styles.footer.stacked.content">
          <section
            v-if="!meta.isMinimal"
            :class="styles.footer.stacked.top"
            aria-label="Language and currency preferences"
          >
            <slot name="footer-actions" />
          </section>

          <section :class="styles.footer.stacked.bottom">
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
import { useStyles, useTestAttrs } from "@upmind-automation/upmind-ui";
import Column from "../../layout/components/column/Column.vue";
import Container from "../../layout/components/container/Container.vue";
import Content from "../../layout/components/content/Content.vue";
import Ribbon from "../../layout/components/ribbon/Ribbon.vue";
import config from "../footer.config";
import { useFooter } from "../useFooter";

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

const styles = useStyles(["footer.stacked"], meta, config, {});
</script>
