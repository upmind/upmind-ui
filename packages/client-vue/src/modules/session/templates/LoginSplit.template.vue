<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT" :currency="false" :locale="false">
    <template #content-header>
      <LoginHeader />
    </template>

    <template #content>
      <LoginForm />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- components
import { LAYOUT_VARIANTS, Layout } from "@upmind-automation/upmind-ui";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
</script>
