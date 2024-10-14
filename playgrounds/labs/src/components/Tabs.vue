<template>
  <div class="w-full border-b border-neutral-300" v-if="items">
    <nav class="flex justify-between space-x-2">
      <template v-for="(item, key) in items" :key="key">
        <button
          type="button"
          class="flex size-10 items-center justify-center gap-x-2 whitespace-nowrap border-b-2 border-transparent text-sm text-gray-500 hover:text-neutral-600 disabled:pointer-events-none disabled:opacity-50"
          :class="
            modelValue == key
              ? 'border-neutral font-semibold text-neutral-600'
              : ''
          "
          @click="$emit('update:modelValue', key)"
          :disabled="item?.disabled"
        >
          <upw-icon :icon="item.icon" class="mb-4 size-5" v-if="item?.icon" />
          <span :class="{ 'sr-only': item?.icon }">{{ item.label }}</span>
        </button>
      </template>
    </nav>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { UpwIcon } from "@upmind-automation/upwind";

export default defineComponent({
  name: "UpmEmbedView",
  components: { UpwIcon },
  emits: ["update:modelValue"],
  props: {
    modelValue: String,
    items: Object,
  },
  setup() {
    const activeTab = ref();
    return {
      activeTab,
    };
  },
});

// ---
</script>
