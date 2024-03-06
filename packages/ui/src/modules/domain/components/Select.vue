<template>
  <h3 class="text-inherit">Select Domain to be used</h3>
  <ul
    tabindex="1"
    role="list"
    class="relative menu rounded-box flex-col flex-nowrap bg-base-100 border border-base-300 w-full mt-6 m-0 min-h-[13em] overflow-y-auto"
    v-if="validDomains.length || processing"
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
        <!-- <progress class="progress progress-primary"></progress> -->
        <span class="loading loading-dots"></span>
      </span>
    </li>

    <template v-else>
      <li
        role="listitem"
        v-for="item in validDomains"
        :key="item?.domain"
        class="p-0"
      >
        <label class="w-full">
          <input
            type="radio"
            name="dac-domain"
            class="radio radio-primary"
            :checked="isSelected(item.domain)"
            :value="item.domain"
            @input="updateModel"
          />

          <span>{{ item.domain }}</span>
        </label>
      </li>
    </template>
  </ul>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- utils
import { filter } from "lodash-es";
// ---------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDacResultsDropdown",
  emits: ["change", "focus", "blur"],
  props: {
    domains: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: String,
    },
    processing: {
      type: Boolean,
      default: false,
    },
    syncing: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    validDomains() {
      return filter(this.domains, "product_id");
    },
  },
  methods: {
    updateModel(event: Event) {
      this.$emit("change", event);
    },

    isSelected(value: string) {
      return this.modelValue === value;
    },
  },
});
</script>
