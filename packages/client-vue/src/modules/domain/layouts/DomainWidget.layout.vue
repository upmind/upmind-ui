<template>
  <Content :flow="COLUMN_FLOW.VERTICAL" class="lg:p-0">
    <slot name="content-header" />

    <slot name="content" />

    <slot name="content-footer" />
  </Content>
</template>

<script setup lang="ts">
import { COLUMN_FLOW } from "../../../components/layout/components/column/types";
import Content from "../../../components/layout/components/content/Content.vue";

// --- types
</script>
