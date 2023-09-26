<template>
  <table class="requests">
    <tr>
      <th>url</th>
      <th>status</th>
    </tr>
    <upm-request
      v-for="(request, hash) in requests"
      :key="hash"
      :hash="hash"
    ></upm-request>
  </table>
</template>

<script setup lang="ts">
import UpmRequest from "./Request.vue";
import { inject } from "vue";
import type { UseApiFunctions } from "@/modules/api/types";

const upmind = inject("upmind") as UseApiFunctions;

// attempt to get the data from a server
const requests = upmind.requests;
</script>
