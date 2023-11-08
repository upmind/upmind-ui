<template>
  <section class="requests w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
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

      <div class="actions flex-none join">
        <slot name="actions">
          <button class="btn btn-ghost" @click="processRequests">
            Add dummy requests
          </button>
        </slot>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4 my-8">
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
