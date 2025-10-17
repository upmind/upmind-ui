<template>
  <Drawer size="lg">
    <template name="trigger"><slot></slot></template>
    <Auth no-header block-tabs stretch-tabs model-value="login" />
  </Drawer>
</template>

<script lang="ts" setup>
import { Drawer } from "@upmind-automation/upmind-ui";
import Auth from "./Auth.vue";
</script>
