<template>
  <!--  -->
</template>

<script setup>

import type { UseApiFunctions } from "@/modules/api/types";
import { delay } from "lodash-es";

const upmind = inject("upmind") as UseApiFunctions;
console.log("App Intialized", upmind);

const requests = ref([]);
// attempt to get the data from a server

// request 1
requests.value.push(upmind
  .get({
    url: "https://dummyjson.com/products/"
  })
  .then(response => console.log("request 1", response))
);

// Dupe 1
requests.value.push( upmind
  .get({
    url: "https://dummyjson.com/products/"
  })
  .then(response => console.log("request duplicate 1", response))
);

requests.value.push( upmind
  .get({
    url: "https://dummyjson.com/products/1"
  })
  .then(response => console.log("request 2", response));

const req4 = delay(
  url => {
    upmind.get({ url }).then(response => {
      return response.data.products;
      console.log("request duplicate 2", response);
    });
  },
  1000,
  "https://dummyjson.com/products/"
);
</script>
