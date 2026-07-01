<template>
  <UpmLayout :variant="LAYOUT_VARIANTS.CANVAS_CARD">
    <div v-for="invoice in invoices" :key="invoice.id">
      <Button
        size="sm"
        variant="subtle"
        :label="invoice.id"
        @click.prevent="
          router.push({ name: 'invoice', query: { id: invoice.id } })
        "
      >
      </Button>
    </div>

    <UpmRouteView v-if="isAuthenticated && !!clientId" />
  </UpmLayout>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import {
  UpmLayout,
  UpmRouteView,
  LAYOUT_VARIANTS,
  useActiveSession
} from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const router = useRouter();

const invoices = [
  {
    id: "20e43579-5e78-d188-d92a-31643202d986"
  }
];

const session = useActiveSession();
const { isAuthenticated } = session.useMeta();
const { sessionId: clientId } = session.useContext();
</script>
