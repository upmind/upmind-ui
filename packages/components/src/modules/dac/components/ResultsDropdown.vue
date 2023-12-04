<template>
  <ul
    tabindex="1"
    role="list"
    class="menu rounded-box flex-col flex-nowrap bg-base-100 border border-base-300 w-full mt-2 absolute top-0 left-0 right-0 z-auto shadow-md min-h-[13em] max-h-[13em] overflow-y-auto"
    v-show="open"
    v-if="results.length || processing"
  >
    <li class="place-self-center" v-if="processing">
      <span class="loading loading-dots text-primary"></span>
    </li>

    <li
      role="listitem"
      v-for="item in results"
      :key="item?.domain"
      :class="[{ disabled: !item.is_available }]"
      class="p-0"
    >
      <label class="w-full">
        <input
          :type="multiple ? 'checkbox' : 'radio'"
          name="dac-domain"
          :class="
            multiple ? 'checkbox checkbox-primary' : 'radio radio-primary'
          "
          :checked="isSelected(item.domain)"
          :disabled="!item.is_available"
          :value="item.domain"
          @input="updateModel"
        />

        {{ item.domain }}

        <span
          class="badge badge-xs badge-primary"
          v-if="item.is_available"
          title="Available"
        ></span>
        <span
          class="badge badge-xs badge-primary opacity-20"
          title="Not Available"
          v-else
        ></span>
      </label>
    </li>
  </ul>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- utils
import { includes } from "lodash-es";

// ---------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDacResultsDropdown",
  emits: ["change", "focus", "blur"],
  props: {
    results: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [String, Array<String>]
    },
    processing: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    open: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    updateModel(event: Event) {
      this.$emit("change", event);
    },

    isSelected(value: string) {
      return this.multiple
        ? includes(this.modelValue, value)
        : this.modelValue === value;
    }
  }
});
</script>
