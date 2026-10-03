<template>
  <slot name="search" />

  <slot name="results" />

  <Teleport to="#domain-aside-footer" defer>
    <slot name="hint" />
  </Teleport>

  <Teleport to="#domain-content-footer" defer>
    <slot name="resolve" />
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false
});
</script>
