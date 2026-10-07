<script setup lang="ts">
import { UpmOrder } from "@upmind-automation/invoice";
import { orderTemplate } from "~/portal/billing/shell";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { PAGE_KEY } from "~/portal/types";
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.BILLING_ORDER_DETAIL]"
    aside-label="Account summary"
  >
    <Suspense>
      <UpmOrder v-slot="{ template }">
        <component :is="orderTemplate(template)" />
      </UpmOrder>
    </Suspense>
  </PortalPageHost>
</template>
