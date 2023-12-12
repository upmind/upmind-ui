<template>
  <ul
    tabindex="1"
    role="list"
    class="relative rounded-box bg-base-100 base-content border border-base-300 divide-lm-contrast/10 dark:divide-dm-contrast/10 divide-y mt-6 w-full p-0 m-0 overflow-hidden"
    v-show="open && (results.length || processing)"
  >
    <li
      v-if="processing"
      class="justify-center gap-x-4 gap-y-1 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6"
    >
      <span class="loading loading-dots text-primary"></span>
    </li>

    <li
      v-else-if="syncing"
      class="absolute top-0 left-0 w-full h-full bg-primary-content bg-opacity-95 text-primary place-content-center gap-x-4 gap-y-1 mt-0 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6 z-10"
    >
      <span class="text-lg text-center">
        <span class="block">Updating the basket</span>
        <progress class="progress progress-primary"></progress>
      </span>
    </li>

    <template v-for="(item, index) in results" :key="item?.domain">
      <slot name="item" v-bind="{ item }">
        <upm-card
          v-bind="item"
          :processing="processing"
          :syncing="syncing"
          :model-value="modelValue"
          :multiple="multiple"
          @change="updateModel"
          :tabindex="index"
        />
      </slot>
    </template>
  </ul>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import UpmCard from "./BasketCard.vue";

// --- utils
import { some } from "lodash-es";

// ---------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDomainAvailable",
  components: {
    UpmCard
  },
  emits: ["change"],
  props: {
    results: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [String, Array<String>]
    },
    multiple: {
      type: Boolean,
      default: false
    },
    syncing: {
      type: Boolean,
      default: false
    },
    processing: {
      type: Boolean,
      default: false
    },
    open: {
      type: Boolean,
      default: true
    }
  },

  methods: {
    updateModel(event: Event) {
      this.$emit("change", event);
    },

    validate(value: string) {
      return some(this.results, { domain: value }) ? value : null;
    }
  }
});
</script>
