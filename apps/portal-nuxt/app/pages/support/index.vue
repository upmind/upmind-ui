<script setup lang="ts">
// Legacy parity (plan §1.2 revised): vue-app's /support landed on tickets,
// never an overview of its own — same surface, nothing more. A brand that
// disables the support system has no support routes at all, so this lands on
// its own client homepage instead (legacy's router guard, plan R8).
import { useMockBrandGates } from "~/portal/mock/gates";

const { isSupportDisabled, homePath } = useMockBrandGates();

if (isSupportDisabled.value) {
  await navigateTo(homePath.value, { replace: true });
} else {
  await navigateTo("/support/tickets", { replace: true });
}
</script>

<template>
  <div />
</template>
