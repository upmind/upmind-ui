<template>
  <VueQueryDevtools buttonPosition="bottom-left" />
  <Upm :theme="theme" :logo="logo"> </Upm>
</template>

<script lang="ts" setup>
import logo from "@/assets/logo.svg?url";
import theme from "./assets/theme";
import { Upm } from "@upmind-automation/client-vue";
import { VueQueryDevtools } from "@tanstack/vue-query-devtools";
</script>
