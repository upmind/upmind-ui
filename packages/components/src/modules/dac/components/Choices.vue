<template>
  <ul
    v-if="choices"
    tabindex="1"
    role="list"
    class="menu rounded-box bg-base-100 border border-base-300 w-full my-12"
  >
    <li
      role="listitem"
      v-for="(label, value) in choices"
      :key="value"
      class="p-0"
    >
      <label class="label w-full justify-start">
        <input
          type="radio"
          name="domain-type"
          class="radio radio-primary"
          :checked="isSelected(value)"
          :value="value"
          @input="doUpdate"
        />
        <span class="label-text">{{ label }}</span>
      </label>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "UpmDacDomainExternal",
  emits: ["update:modelValue"],
  props: {
    choices: {
      type: Object,
      required: true
    },
    modelValue: {
      type: String
    }
  },
  methods: {
    doUpdate(event: Event) {
      this.$emit("update:modelValue", event);
    },
    isSelected(value: string) {
      return this.modelValue === value;
    }
  }
});
</script>
