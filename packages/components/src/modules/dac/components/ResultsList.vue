<template>
  <ul
    tabindex="1"
    role="list"
    class="rounded-box bg-base-100 base-content border border-base-300 divide-lm-contrast/10 dark:divide-dm-contrast/10 divide-y mt-6 w-full p-0 m-0 overflow-hidden"
    v-show="open && (results.length || processing)"
  >
    <li
      v-if="processing"
      class="justify-center gap-x-4 gap-y-1 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6"
    >
      <span class="loading loading-dots text-primary"></span>
    </li>

    <template v-for="(item, index) in results" :key="item?.domain">
      <slot name="item" v-bind="{ item }">
        <upm-card
          v-bind="item"
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
  name: "UpmDacResultsList",
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
