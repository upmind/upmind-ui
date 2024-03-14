<template>
  <section class="brand w-full">
    <header
      class="navbar sticky top-0 z-10 rounded-box bg-base-100 pl-4 shadow-md"
    >
      <div class="flex-1">
        <h2 class="title m-0 flex items-center gap-2">
          Brand

          <progress
            v-if="meta.isLoading"
            class="progress progress-primary w-24"
          ></progress>

          <template v-else>
            <span class="badge badge-primary" v-if="meta.isReady">
              is Ready!</span
            >
            <span class="badge badge-success" v-else-if="meta.isComplete">
              is Complete!</span
            >
            <span class="badge badge-error" v-if="meta.hasErrors">
              has Errors!</span
            >
          </template>
        </h2>
      </div>

      <div class="actions join flex-none">
        <slot name="actions"> </slot>
      </div>
    </header>

    <div
      class="my-8 grid grid-cols-1 gap-4 rounded-box bg-base-200 p-4 text-base-content"
      :data-theme="activeTheme"
    >
      <template v-for="(values, key) in responses" :key="key">
        <div
          class="collapse-plus collapse mb-2 rounded-box border border-neutral-300 border-opacity-50"
          :class="{ 'border-neutral': values }"
        >
          <input type="checkbox" name="request" />

          <div class="collapse-title">
            <h4 class="m-0 flex items-center gap-2 text-inherit">
              <span class="badge badge-success badge-xs" v-if="values"></span>

              <span class="badge badge-neutral badge-outline badge-xs" v-else>
              </span>

              <span class="inline-flex items-center gap-1"
                >{{ startCase(key) }}
                <em class="text-xs">{{ getCount(values) }}</em></span
              >
            </h4>
          </div>

          <code
            class="mockup-code collapse-content min-w-full rounded-none"
            v-if="values"
          >
            <pre>
               <div>{{ values }}</div>
            </pre>
          </code>
        </div>
      </template>
    </div>

    <footer>
      <upm-debug
        title="Brand"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { useBrand } from "@upmind/vue";
import { UpmDebug } from "@upmind/ui";
import { startCase, isArray, isObject } from "lodash-es";

const activeTheme = inject("activeTheme");

const { state, context, meta, errors, responses } = useBrand();

function getCount(values: any) {
  let result = null;

  if (isArray(values)) {
    result = values.length;
  } else if (isObject(values)) {
    result = Object.values(values).length;
  }

  if (result) return `(${result})`;

  return;
}
</script>
