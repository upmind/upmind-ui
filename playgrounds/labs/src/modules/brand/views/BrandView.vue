<template>
  <div class="relative mx-auto flex w-full flex-wrap">
    <Spinner class="w-full justify-center text-center" v-if="meta.isLoading" />

    <div
      class="mx-4 h-screen max-h-full w-full items-start justify-center overflow-auto p-6"
    >
      <table class="w-full divide-y divide-base-200">
        <thead class="bg-base-50">
          <tr>
            <th scope="col" class="py-3 pe-6 ps-6 text-start lg:ps-3 xl:ps-0">
              <div class="flex items-center gap-x-2">
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-base-800"
                >
                </span>
              </div>
            </th>

            <th scope="col" class="px-6 py-3 text-start">
              <div class="flex items-center gap-x-2">
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-base-800"
                >
                  Group
                </span>
              </div>
            </th>

            <th scope="col" class="px-6 py-3 text-start">
              <div class="flex items-center gap-x-2">
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-base-800"
                >
                  Count
                </span>
              </div>
            </th>

            <th scope="col" class="px-6 py-3 text-start">
              <div class="flex items-center gap-x-2">
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-base-800"
                >
                  Values
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-base-200">
          <tr v-for="(values, key) in responses" :key="key">
            <td class="size-px whitespace-nowrap py-3 ps-6">
              <span
                class="inline-block size-2 rounded-full bg-success"
                v-if="values"
              >
              </span>
              <span class="inline-block size-3 rounded-full bg-neutral" v-else>
              </span>
            </td>

            <td class="size-px whitespace-nowrap py-3 ps-6">
              <h4 class="m-0 flex items-center gap-2 text-inherit">
                {{ startCase(key) }}
              </h4>
            </td>
            <td class="size-px whitespace-nowrap py-3 ps-6">
              {{ getCount(values) }}
            </td>
            <td class="size-px">
              <code>
                <pre>{{ values }}</pre>
              </code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBrand } from "@upmind/headless-vue";
import { startCase, isArray, isObject } from "lodash-es";
import { Spinner } from "@upmind/upwind";

const { meta, responses } = useBrand(message =>
  window?.top?.postMessage(message, "*")
);

function getCount(values: any) {
  let result = null;

  if (isArray(values)) {
    result = values.length;
  } else if (isObject(values)) {
    result = Object.values(values).length;
  }

  return result;
}
</script>
