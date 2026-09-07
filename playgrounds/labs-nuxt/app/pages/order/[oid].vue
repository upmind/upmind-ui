<template>
  <div data-test-key="order-page">
    <UpmOrder />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/order/[oid]
 * @description The order/invoice pay PAGE — the parent the pay overlay opens
 * over (FE-3133). It renders the reused `useOrder` engine via `UpmOrder`, which
 * reads the `oid` route param itself. An off-site gateway return lands here with
 * `?operation_id`; the labs funnel promotes it to the `<order>--pay` overlay
 * child, so this page needs no return logic of its own.
 */

import { UpmOrder } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.ORDER
});
</script>
