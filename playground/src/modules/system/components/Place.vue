<template>
  <div
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? '  border-error' : '',
      meta.isComplete ? ' card-bordered border-primary' : ''
    ]"
  >
    <div class="card-body">
      <h2 class="card-title m-0">
        <map-pin-icon class="w-6 h-6" />
        {{ title }}
      </h2>

      <p class="m-0">
        {{ display }}

        <sub
          v-if="meta.isLoading && !meta.hasErrors"
          class="loading loading-dots loading-xs opacity-25"
        ></sub>
      </p>

      <p v-if="meta.hasErrors" class="text-error text-sm m-0">
        {{ errors }}
      </p>

      <div class="card-actions justify-between items-center border-t pt-2 mt-2">
        <div class="form-control">
          <label class="cursor-pointer label p-0">
            <input
              type="checkbox"
              class="checkbox"
              :class="{ 'checkbox-primary': selected }"
              :checked="selected"
              @input="doSelect(item.id)"
            />
            <span class="label-text ml-2">Use this address</span>
          </label>
        </div>

        <div class="dropdown dropdown-end">
          <div
            tabindex="0"
            role="button"
            class="btn btn-sm btn-square btn-ghost"
          >
            <ellipsis-vertical-icon class="w-6 h-6" />
          </div>
          <ul
            tabindex="0"
            class="menu menu-xs dropdown-content z-10 p-2 shadow bg-base-100 rounded w-52 mt-0"
          >
            <li><a>Item 1</a></li>
            <li><a>Item 2</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSystemPlace } from "..";
import { MapPinIcon, EllipsisVerticalIcon } from "@heroicons/vue/24/solid";

export default defineComponent({
  name: "UpmPlace",
  components: { MapPinIcon, EllipsisVerticalIcon },
  emits: ["select"],
  props: {
    item: {
      type: Object, // xstate actor
      required: true
    },

    selected: {
      type: Boolean,
      default: false
    },

    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { state, context, meta, errors, model, title, display } =
      useSystemPlace(props.item);

    return {
      state,
      context,
      meta,
      errors,
      model,
      title,
      display
    };
  },
  methods: {
    doSelect(item) {
      this.$emit("select", item);
    }
  }
});
</script>
