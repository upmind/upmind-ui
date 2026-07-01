<template>
  <DomainWidget>
    <template #content-header>
      <slot name="search" />
    </template>

    <template #content>
      <slot name="results" />
    </template>
  </DomainWidget>

  <Teleport to="#domain-aside-footer" defer>
    <slot name="hint" />
  </Teleport>

  <Teleport to="#domain-content-footer" defer>
    <slot name="resolve" />
  </Teleport>
</template>

<script setup lang="ts">
import DomainWidget from "../layouts/DomainWidget.layout.vue";

defineOptions({
  inheritAttrs: false
});
</script>
