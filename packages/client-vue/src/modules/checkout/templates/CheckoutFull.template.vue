<template>
  <Layout>
    <template #content-header>
      <slot name="summary" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template #aside>
      <slot name="pricing" />
      <slot name="errors" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useLayout } from "../../../components/layout/useLayout";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_PADDING } from "../../../components/header/types";

defineOptions({
  inheritAttrs: false
});

const { isResolved } = useRoutingEngine();

onMounted(async () => {
  await isResolved();
  useHeader({});

  useLayout({
    variant: LAYOUT_VARIANTS.FULL
  });

  useFooter({});
});
</script>
