<template>
  <Dialog classContent="pt-12 sm:max-w-[540px]">
    <template name="trigger"><slot></slot></template>
    <Auth no-header block-tabs stretch-tabs model-value="login" />
  </Dialog>
</template>

<script lang="ts" setup>
import { Dialog } from "@upmind-automation/upmind-ui";
import Auth from "./Auth.vue";
</script>
