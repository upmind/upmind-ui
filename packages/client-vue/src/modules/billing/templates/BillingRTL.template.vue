<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL">
    <template #navigation>
      <slot name="back" />
    </template>

    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="content" />
      <slot v-if="isMobile" name="content-footer" />
    </template>

    <template #aside>
      <slot name="markdown" />
    </template>

    <template v-if="!isMobile" #content-footer>
      <slot name="content-footer" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import Layout from "../../../components/layout/Layout.vue";
import { isMobile } from "@upmind-automation/upmind-ui";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  useHeader({
    background: HEADER_BACKGROUND.RTL,
    border: "none",
    items: "end"
  });

  useFooter({
    visible: false
  });
});
</script>
