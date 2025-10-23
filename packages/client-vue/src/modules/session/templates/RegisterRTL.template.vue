<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL" :currency="false">
    <template #content-header>
      <RegisterHeader />
    </template>

    <template #content>
      <RegisterForm section />
    </template>

    <template #aside>
      <RegisterAside section />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
import Layout from "../../../components/layout/Layout.vue";
import RegisterHeader from "../components/RegisterHeader.vue";
import RegisterForm from "../components/RegisterForm.vue";
import RegisterAside from "../components/RegisterAside.vue";
</script>
