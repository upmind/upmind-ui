<template>
  <fieldset :disabled="processing" class="flex w-full">
    <label class="label text-start w-full" for="quantity">
      <span class="label-text">Quantity</span>
    </label>

    <div class="join">
      <button
        class="btn btn-square btn-sm join-item"
        @click.prevent="
          $emit('update:increment', { value: modelValue, min, max, step })
        "
      >
        +
      </button>

      <input
        class="input input-sm join-item text-center max-w-[5em]"
        type="number"
        v-model="modelValue"
        :min="min"
        :max="max"
        :step="step"
        readonly
      />

      <button
        class="btn btn-square btn-sm join-item"
        @click.prevent="
          $emit('update:decrement', { value: modelValue, min, max, step })
        "
      >
        -
      </button>
    </div>
  </fieldset>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Quantity",
  components: {},
  inheritAttrs: true,
  customOptions: {},
  emits: ["update:increment", "update:decrement"],
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 10
    },
    step: {
      type: Number,
      default: 1
    },
    modelValue: {
      type: Number,
      default: 1
    }
  }
});
</script>
