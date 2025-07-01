<template>
  <Upm :theme="theme" :logo="logo">
    <template #footer>
      <Footer />
    </template>
  </Upm>
</template>

<script lang="ts" setup>
import logo from "@/assets/logo.svg?url";
import theme from "./assets/theme";
import Footer from "@/components/Footer.vue";
import { Upm } from "@upmind-automation/client-vue";
</script>
