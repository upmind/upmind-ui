<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL">
    <template #content>
      <slot name="errors" />
      <slot name="configuration" />
      <slot name="apply-to-others" />
    </template>

    <template #content-footer>
      <div class="flex w-full items-center gap-4">
        <slot name="progress" />
        <slot name="actions" />
      </div>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useLayout } from "../../../components/layout/useLayout";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.FULL
});

onMounted(() => {
  useHeader({});
  useFooter({});
});
</script>
