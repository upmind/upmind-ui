<template>
  <Drawer size="xl" to="#vue-app">
    <template name="trigger"><slot></slot></template>
    <Session no-header block-tabs stretch-tabs model-value="login" />
  </Drawer>
</template>

<script lang="ts" setup>
import { Drawer } from "@upmind-automation/upwind";
import Session from "./Session.vue";
</script>
