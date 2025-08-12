<template>
  <Layout>
    <UpmContentSection class="mx-auto max-w-app" title="Terms and Conditions">
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
