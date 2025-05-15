<template>
  <Upm :theme="theme" :logo="logo"> </Upm>
</template>

<script lang="ts" setup>
import logo from "@/assets/logo.svg?url";
import { Upm } from "@upmind-automation/client-vue";
import theme from "./assets/theme";
</script>
