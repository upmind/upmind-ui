<template>
  <Layout :variant="LAYOUT_VARIANTS.CANVAS_CARD" :mode="LAYOUT_MODE.CENTERED">
    <template #content-header>
      <slot name="hero" />
      <slot name="markdown" />
    </template>

    <template #content>
      <slot name="form" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import Layout from "../../../components/layout/Layout.vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { LAYOUT_MODE } from "../../../components/layout/types";
import type { SessionRoutes } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<SessionRoutes>();

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  useHeader({
    visible: false
  });

  useFooter({
    visible: false
  });
});
</script>
