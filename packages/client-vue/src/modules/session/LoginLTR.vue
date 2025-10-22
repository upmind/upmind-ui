<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR" :currency="false">
    <template #content-header>
      <LoginHeader />
    </template>

    <template #content>
      <LoginForm />
    </template>

    <template #aside>
      <LoginAside />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import LoginHeader from "./components/login/LoginHeader.vue";
import LoginForm from "./components/login/LoginForm.vue";
import LoginAside from "./components/login/LoginAside.vue";
</script>

