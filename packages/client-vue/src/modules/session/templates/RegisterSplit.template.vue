<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT">
    <template #content-header>
      <div class="flex h-full flex-col justify-between">
        <HeaderBrand class="pb-12" />
        <RegisterHeader />
      </div>
    </template>

    <template #content>
      <RegisterForm />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import Layout from "../../../components/layout/Layout.vue";
import RegisterHeader from "../components/RegisterHeader.vue";
import RegisterForm from "../components/RegisterForm.vue";
import HeaderBrand from "../../../components/header/HeaderBrand.vue";
</script>
