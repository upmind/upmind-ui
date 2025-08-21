<template>
  <Layout>
    <UpmContentSection class="max-w-app mx-auto" title="Terms and Conditions">
      <UpmTermsAndConditions />
    </UpmContentSection>
  </Layout>
</template>

<script setup lang="ts">
import { Layout } from "@upmind-automation/upmind-ui";
import {
  UpmTermsAndConditions,
  UpmContentSection
} from "@upmind-automation/client-vue";
</script>
