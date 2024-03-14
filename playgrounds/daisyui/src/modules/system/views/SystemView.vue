<template>
  <section class="system w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-box"
    >
      <div class="flex-1">
        <h2 class="title m-0 flex gap-2 items-center">
          System

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

      <div class="actions flex-none join">
        <slot name="actions">
          <select
            class="select select-bordered select-sm w-24 md:w-auto join-item"
            v-model="selected"
            placeholder="Select Option"
          >
            <option></option>
            <option
              v-for="(values, key) in items"
              :key="`item-${key}`"
              :value="key"
              :label="startCase(key)"
            ></option>
          </select>

          <button
            class="btn btn-primary btn-sm join-item"
            type="submit"
            :disabled="meta.isLoading || meta.isComplete || !selected"
            @click.prevent="fetch(selected, items[selected])"
          >
            <!-- <div class="indicator"> -->
            <!-- <span class="indicator-item"> -->
            <!-- </span> -->

            <folder-arrow-down-icon class="h-6 w-6" />
            <!-- <PlusIcon class="h-4 w-4 -ml-3" /> -->
            <!-- </div> -->
          </button>
        </slot>
      </div>
    </header>

    <div
      class="grid grid-cols-1 gap-4 my-8 rounded-box p-4 bg-base-200 text-base-content"
      :data-theme="activeTheme"
    >
      <template v-for="(values, key) in responses" :key="key">
        <div
          class="collapse collapse-plus border border-opacity-50 border-neutral-300 rounded-box mb-2"
          :class="{ 'border-neutral': values }"
        >
          <input type="checkbox" name="request" />

          <div class="collapse-title">
            <h4 class="m-0 text-inherit flex gap-2 items-center">
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
        title="System"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import { useSystem } from "@upmind/vue";
import { UpmDebug } from "@upmind/ui";
import { FolderArrowDownIcon } from "@heroicons/vue/24/outline";
import { startCase, isArray, isObject } from "lodash-es";

const activeTheme = inject("activeTheme");

const selected = ref();

const items = {
  // "currencies": {},
  // "billingCycles": {},
  countries: {},
  regions: {},
  languages: {},
  statuses: {},
  departments: {},
};

const { state, context, meta, errors, fetch, responses } = useSystem();
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
