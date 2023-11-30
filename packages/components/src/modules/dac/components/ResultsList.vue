<template>
  <ul
    tabindex="1"
    role="list"
    class="rounded-box bg-base-100 base-content border border-base-300 divide-lm-contrast/10 dark:divide-dm-contrast/10 divide-y mt-6 w-full p-0 m-0 overflow-hidden"
  >
    <li
      v-if="processing"
      class="justify-center gap-x-4 gap-y-1 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6"
    >
      <span class="loading loading-dots text-primary"></span>
    </li>

    <template v-for="item in results" :key="item?.domain">
      <slot name="item" v-bind="{ item }">
        <upm-card
          v-bind="item"
          :model-value="modelValue"
          @change="updateModel"
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
  emits: ["update:modelValue", "change"],
  props: {
    results: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: String
    },
    processing: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    updateModel(event: Event) {
      this.$emit("change", event);
      // ---
      const target = event.currentTarget as HTMLInputElement;
      const value = this.validate(target?.value);

      this.$emit("update:modelValue", value);
    },

    validate(value: string) {
      return some(this.results, { domain: value }) ? value : null;
    }
  }
});
</script>
