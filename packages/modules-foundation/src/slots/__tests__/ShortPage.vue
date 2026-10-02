<template>
  <MainOrganism v-slot="{ template }">
    <FrameLayout :title="template" />
  </MainOrganism>
</template>

<script lang="ts" setup>
import FrameLayout from "./FrameLayout.vue";
import MainOrganism from "./MainOrganism.vue";
</script>
