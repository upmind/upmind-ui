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
import { delay } from "lodash-es";

const upmind = inject("upmind") as UseApiFunctions;
console.log("App Intialized", upmind);

// attempt to get the data from a server
const requests = upmind.requests;

// Request 1
upmind
  .get({
    url: "https://dummyjson.com/products/"
  })
  .then(response => console.log("request 1", response));

// Dupe 1
upmind
  .get({
    url: "https://dummyjson.com/products/"
  })
  .then(response => console.log("request duplicate 1", response));

// Request 2
upmind
  .get({
    url: "https://dummyjson.com/products/1"
  })
  .then(response => console.log("request 2", response));

// Dupe 2
delay(
  url => {
    upmind.get({ url }).then(response => {
      return response.data;
      console.log("request duplicate 2", response);
    });
  },
  1000,
  "https://dummyjson.com/products/"
);
</script>
