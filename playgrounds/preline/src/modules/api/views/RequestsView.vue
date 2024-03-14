<template>
  <section class="requests w-full">
    <header
      class="navbar sticky top-0 z-10 rounded-box bg-base-100 pl-4 shadow-md"
    >
      <div class="flex-1">
        <h2 class="title m-0">
          <span v-if="meta.isActive" class="text-primary">{{ count }}</span>
          Requests

          <span v-if="meta.isActive">
            are <span class="text-primary">Active</span>
          </span>
        </h2>
      </div>

      <div class="actions join flex-none">
        <slot name="actions">
          <button class="btn btn-outline btn-sm" @click="processRequests">
            Add dummy requests
          </button>
        </slot>
      </div>
    </header>

    <div
      class="my-8 grid grid-cols-1 gap-4 rounded-box bg-base-200 p-4 text-base-content"
      :data-theme="activeTheme"
    >
      <upm-request
        v-for="(request, hash) in requests"
        :key="hash"
        :hash="hash"
      ></upm-request>
    </div>

    <footer>
      <upm-debug
        title="Requests"
        :state="state"
        :errors="errors"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { delay, forEach } from "lodash-es";
import UpmRequest from "../components/Request.vue";
import { useApi } from "@upmind/vue";
import { UpmDebug } from "@upmind/ui";

const { state, errors, count, meta, requests, get, useTime } = useApi();

const activeTheme = inject("activeTheme");

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
    maxAge: useTime().MINUTE * 10,
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
    useCache: false,
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().IMMIDIATE,
    useCache: false,
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 15,
    useCache: false,
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 30,
    useCache: false,
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 45,
    useCache: false,
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 60,
    useCache: false,
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 75,
    useCache: false,
  },
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
