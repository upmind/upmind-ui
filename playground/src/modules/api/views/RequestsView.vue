<template>
  <section class="requests">
    <header class="toolbar">
      <h2 class="title">
        Requests <span v-if="meta.isActive">({{ count }})</span>
      </h2>
      <div class="actions">
        <slot name="actions">
          <button @click="processRequests">Process dummy requests</button>
        </slot>
      </div>
    </header>

    <div class="content">
      <upm-request
        v-for="(request, hash) in requests"
        :key="hash"
        :hash="hash"
      ></upm-request>
    </div>

    <footer>
      <Debug
        title="Requests"
        :state="state"
        :errors="errors"
        :meta="meta"
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { delay, forEach } from "lodash-es";
import UpmRequest from "../components/Request.vue";
import Debug from "@/components/Debug.vue";
import { useApi } from "..";
const { state, errors, count, meta, requests, get, useTime } = useApi();

const dummyRequests = [
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
    maxAge: useTime().MINUTE * 10
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

function processRequests() {
  forEach(dummyRequests, request => {
    delay(
      ({ url, init, useCache, maxAge }) => get({ url, init, useCache, maxAge }),
      request.delay,
      request
    );
  });
}
</script>
