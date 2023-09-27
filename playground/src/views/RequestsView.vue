<script setup lang="ts">
import UpmRequests from "@/modules/api/components/Requests.vue";

import { inject, onMounted } from "vue";
import type { UseApiFunctions } from "@/modules/api/types";
import { delay, forEach } from "lodash-es";

const { get, useTime } = inject("upmind") as UseApiFunctions;

const requests = [
  // --- request 1
  { url: "https://dummyjson.com/products/", delay: useTime().IMMIDIATE },
  { url: "https://dummyjson.com/products/", delay: useTime().IMMIDIATE },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 15 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 30 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 45 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 60 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 75 },

  // --- request 2
  {
    url: "https://dummyjson.com/products/1",
    delay: useTime().IMMIDIATE,
    maxAge: useTime().MINUTE
  },
  { url: "https://dummyjson.com/products/1", delay: useTime().IMMIDIATE },
  { url: "https://dummyjson.com/products/1", delay: useTime().SECOND * 15 },
  { url: "https://dummyjson.com/products/1", delay: useTime().SECOND * 30 },
  { url: "https://dummyjson.com/products/1", delay: useTime().SECOND * 45 },
  { url: "https://dummyjson.com/products/1", delay: useTime().MINUTE * 60 },
  { url: "https://dummyjson.com/products/1", delay: useTime().MINUTE * 75 },

  // --- request 3
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().IMMIDIATE,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().IMMIDIATE,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 15,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 30,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 45,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 60,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 75,
    useCache: false
  }
];

onMounted(() => {
  forEach(requests, request => {
    delay(
      ({ url, init, useCache, maxAge }) => {
        console.log("fetching...", request.url, request.delay);
        get({ url, init, useCache, maxAge }).then(({ data }) =>
          console.log("fetched", request.url, request.delay)
        );
      },
      request.delay,
      request
    );
  });
});
</script>

<template>
  <upm-requests />
</template>
