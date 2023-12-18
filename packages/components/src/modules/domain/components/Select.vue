<template>
  <h3>Select Domain to be used</h3>
  <ul
    tabindex="1"
    role="list"
    class="menu rounded-box flex-col flex-nowrap bg-base-100 border border-base-300 w-full max-h-[13em] overflow-y-auto m-0"
    v-if="domains.length || processing"
  >
    <li class="place-self-center" v-if="processing">
      <span class="loading loading-dots text-primary"></span>
    </li>

    <li role="listitem" v-for="item in domains" :key="item?.domain" class="p-0">
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
  </ul>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- utils

// ---------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDacResultsDropdown",
  emits: ["change", "focus", "blur"],
  props: {
    domains: {
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
    },

    isSelected(value: string) {
      return this.modelValue === value;
    }
  }
});
</script>
