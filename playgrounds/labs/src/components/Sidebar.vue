<template>
  <aside class="">
    <header class="view-header flex flex-col gap-2">
      <p class="inline-flex items-center">
        <span
          v-if="icon"
          class="mr-2 inline-flex size-8 items-center justify-center rounded-full bg-neutral-200 text-neutral"
        >
          <upw-icon :icon="icon" class="size-5" />
        </span>

        <span
          v-if="flow"
          class="view-flow py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400"
        >
          {{ flow }}
        </span>
      </p>

      <h1
        v-if="title || icon"
        class="view-title inlne-flex text-xl font-bold text-neutral sm:text-3xl"
      >
        {{ title }}
      </h1>

      <p
        v-if="description"
        class="view-description mt-2 text-sm text-neutral-500"
      >
        {{ description }}
      </p>

      <div
        class="view-actions my-8 flex items-center gap-2 sm:gap-3"
        v-if="$slots.actions"
      >
        <slot name="actions"></slot>
      </div>
    </header>

    <div>
      <slot></slot>
    </div>
  </aside>
</template>

<script>
import { defineComponent } from "vue";
import { UpwIcon } from "@upmind/upwind";

export default defineComponent({
  name: "UpmView",
  components: { UpwIcon },
  props: {
    icon: { type: [String, Object], default: null },
    title: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    flow: {
      type: String,
      required: false,
    },
  },

  setup() {},
});
</script>
