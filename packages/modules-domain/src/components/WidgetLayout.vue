<template>
  <Content :flow="COLUMN_FLOW.VERTICAL" class="lg:p-0">
    <slot name="search" />

    <slot name="results" />
  </Content>

  <Teleport to="#domain-aside-footer" defer>
    <slot name="hint" />
  </Teleport>

  <Teleport to="#domain-content-footer" defer>
    <slot name="resolve" />
  </Teleport>
</template>

<script setup lang="ts">
import { COLUMN_FLOW, Content } from "@upmind-automation/foundation";

defineOptions({
  inheritAttrs: false
});
</script>
