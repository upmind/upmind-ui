<template>
  <DomainWidget>
    <template #content-header>
      <slot name="search" />
    </template>

    <template #content>
      <slot name="results" />
    </template>
  </DomainWidget>

  <Teleport to="#catalogue-content-footer">
    <slot name="resolve" />
  </Teleport>
</template>

<script setup lang="ts">
// --- internal
import DomainWidget from "../layouts/DomainWidget.layout.vue";
import { useSlots } from "vue";
import { isEmptySlot } from "@upmind-automation/upmind-ui";

const slots = useSlots();

defineOptions({
  inheritAttrs: false
});
</script>
