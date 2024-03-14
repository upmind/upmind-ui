<template>
  <nav
    class="hs-accordion-group flex w-full flex-col flex-wrap"
    data-hs-accordion-always-open
    v-if="inspector && isDebugging"
  >
    <ul class="w-full space-y-3">
      <li
        v-for="(item, key) in inspector"
        :key="key"
        class="hs-accordion w-full"
        :id="`accordion-${key}`"
      >
        <button
          type="button"
          class="hs-accordion-toggle flex w-full items-center gap-x-3.5 rounded border border-neutral-200 bg-base px-3 py-2 text-start text-sm font-medium text-neutral hover:bg-neutral-100 hs-accordion-active:rounded-b-none hs-accordion-active:bg-neutral-700 hs-accordion-active:text-neutral-content hs-accordion-active:hover:bg-neutral-700"
        >
          {{ startCase(key) }}

          <upm-icon
            name="arrow-up"
            class="ms-auto hidden size-3 group-hover:text-neutral-500 hs-accordion-active:block"
          />
          <upm-icon
            name="arrow-down"
            class="ms-auto block size-3 group-hover:text-neutral-500 hs-accordion-active:hidden"
          />
        </button>

        <div
          :id="`accordion-${key}`"
          class="hs-accordion-content hidden w-full overflow-auto rounded-b border border-t-0 border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 transition-[height] duration-300"
        >
          <pre class="w-full overflow-scroll">{{ item }}</pre>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { startCase, defaultsDeep, omitBy, isEmpty, get } from "lodash-es";
import UpmIcon from "@/components/Icon.vue";

export default defineComponent({
  name: "UpmInspctor",
  components: { UpmIcon },
  inheritAttrs: true,
  customOptions: {},
  inject: ["inspectors"],
  props: {
    flow: { type: String, required: true },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    return {
      startCase,
    };
  },
  computed: {
    isDebugging(): boolean {
      return import.meta.env.DEV;
    },
    inspector() {
      const inspector = get(this.inspectors, this.flow);
      return omitBy(
        defaultsDeep(inspector, {
          state: null,
          context: null,
          meta: null,
          errors: null,
          model: null,
        }),
        isEmpty
      );
    },
  },
});
</script>
