<template>
  <div class="ml-auto mr-auto min-w-[20rem] max-w-4xl">
    <fieldset class="form-control">
      <label for="domain-search" class="form">
        <span class="label-text">search for domain</span>
      </label>

      <div class="input input-primary input-bordered join items-center px-0">
        <magnifying-glass-icon class="w-8 h-8 join-item mx-2" />

        <input
          ref="input"
          id="domain-search"
          class="flex-1 rounded-none px-2 h-full"
          placeholder="Find your domain"
          v-model="domain"
          type="text"
        />

        <button
          v-if="meta.hasValue"
          type="reset"
          class="btn btn-link btn-square mx-2"
          tabindex="-1"
          @click="reset(input)"
        >
          <backspace-icon class="w-8 h-8" />
        </button>

        <div class="join-item">
          <button
            class="btn btn-primary"
            :disabled="meta.isProcessing || !meta.hasValue"
            @click="doSearch"
          >
            <span
              class="loading loading-spinner"
              v-if="meta.isProcessing"
            ></span>

            Search
          </button>
        </div>
      </div>
    </fieldset>

    <div
      class="flex items-center justify-center min-h-[10rem]"
      v-if="meta.hasValue && meta.isProcessing"
    >
      <span class="loading loading-dots loading-lg text-primary"></span>
    </div>

    <div
      class="results flex flex-col items-center justify-center"
      v-if="meta.hasResults"
    >
      <slot name="results" v-bind="{ results }">
        <ul role="list" class="menu rounded-box w-full">
          <li v-for="{ item } in results" :key="item.domain" role="listitem">
            <slot name="item" v-bind="{ item }">
              <code>
                <pre>{{ item }}</pre>
              </code>
            </slot>
          </li>
        </ul>
      </slot>

      <template v-if="hasMoreResults">
        <button class="btn btn-sm" @click="loadMore" :disabled="isProcessing">
          Load more
        </button>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
import { BackspaceIcon } from "@heroicons/vue/24/outline";

// --- internal
import { useDac } from "./composables";

// ---

export default defineComponent({
  name: "UpmDac",
  components: {
    MagnifyingGlassIcon,
    BackspaceIcon
  },
  props: {
    coupons: {
      type: Array,
      default: () => []
    },
    currencyCode: {
      type: String,
      default: ""
    },
    limit: {
      type: Number,
      default: 10
    },
    orderConfigUrl: {
      type: String,
      default: ""
    },
    skeletonCount: {
      type: Number,
      default: null
    }
  },
  setup(props) {
    const input = ref<InstanceType<typeof HTMLInputElement>>();

    const {
      meta,
      domain,
      results,
      // --- Methods
      reset,
      doSearch,
      loadMore
    } = useDac(props);

    return {
      // --- Refs
      input,
      // --- Data
      domain,
      meta,
      results,
      // --- Methods
      reset,
      doSearch,
      loadMore
    };
  }
});
</script>
./composables
