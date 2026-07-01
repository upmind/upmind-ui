<template>
  <UpmLayout>
    <div v-if="!isReady">
      <Alert color="info" title="Loading invoice..." />
    </div>

    <div v-else-if="error">
      <Alert
        color="danger"
        title="Error loading invoice"
        :message="error.message"
      />
    </div>

    <div v-else-if="data">
      <pre class="rounded-lg bg-black p-4 text-white">
        {{ JSON.stringify(data, null, 2) }}
      </pre>
    </div>

    <Button
      variant="subtle"
      label="Back to Invoices"
      class="mt-4"
      @click.prevent="$router.push({ name: 'invoices' })"
    >
    </Button>
  </UpmLayout>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { UpmLayout } from "@upmind-automation/client-vue";
import { useOrder } from "@upmind-automation/headless";
import { Button, Alert } from "@upmind-automation/upmind-ui";

const route = useRoute();
const invoiceId = route.query.id as string;

const { data, error, isReady } = useOrder(invoiceId);
</script>
