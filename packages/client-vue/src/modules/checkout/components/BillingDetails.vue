<template>
  <Addresses v-if="!isEmpty(data)" />

  <Add v-else />
</template>

<script setup lang="ts">
// --- internal
import { useClientAddresses } from "@upmind-automation/headless-vue";

// --- components
import Addresses from "../../client/Addresses.vue";
import Add from "../../client/components/address/Add.vue";

// --- utils
import { isEmpty } from "lodash-es";

const { isReady, getAll, data, meta, error, invalidate, remove, setDefault } =
  useClientAddresses();

await isReady().then(() => {
  getAll();
});
</script>
