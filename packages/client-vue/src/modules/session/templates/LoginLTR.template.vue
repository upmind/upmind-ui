<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR" :currency="false">
    <template #content-header>
      <LoginHeader />
    </template>

    <template #content>
      <LoginForm section />
    </template>

    <template #aside>
      <LoginAside section />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- components
import Layout from "../../../components/layout/Layout.vue";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
import LoginAside from "../components/LoginAside.vue";

// --- types
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
</script>
