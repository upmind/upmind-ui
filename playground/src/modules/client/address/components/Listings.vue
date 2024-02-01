<template>
  <div class="grid gap-4 grid-cols-card w-full">
    <div class="col-span-full text-center" v-if="meta.isLoading || processing">
      <span class="loading loading-dots"></span>
    </div>

    <template v-if="!meta.isLoading">
      <input
        class="input input-bordered col-span-full"
        @input="filter($event?.currentTarget?.value)"
        placeholder="Filter by..."
      />

      <upm-card
        v-for="item in items"
        :key="item.id"
        :item="item"
        :selected="item.id === selected?.id"
        @select="select"
        :class="[
          meta.isEditing || processing
            ? 'hidden opacity-50 pointer-events-none'
            : '',
          {
            'border-primary': item.id === selected?.id
            // 'col-span-full': item.id === selected?.id && meta.isEditing
          }
        ]"
      />

      <upm-form
        class="shadow border border-neutral col-span-full"
        :item="selected"
        v-if="meta.isEditing"
        :key="selected.id"
      ></upm-form>

      <div
        class="actions flex justify-center items-center min-h-36 h-full max-w-full"
        v-if="!meta.isEditing"
      >
        <button class="btn btn-block h-full" @click="add">
          <squares-plus-icon class="w-6 h-6" /> Add new
        </button>
      </div>
    </template>
    <upm-debug
      v-if="debugging"
      title="Addresses"
      :state="state"
      :context="context"
      :errors="errors"
      :meta="meta"
      class="mt-8"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useClientAddresses } from "..";
import UpmCard from "./Card.vue";
import UpmForm from "./Form.vue";
import { UpmDebug } from "@upmind/components";
import { SquaresPlusIcon } from "@heroicons/vue/24/outline";

import { isEqual } from "lodash-es";

export default defineComponent({
  name: "UpmAddresses",
  components: {
    SquaresPlusIcon,
    UpmCard,
    UpmForm,
    UpmDebug
  },
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: String,
      default: ""
    },
    processing: {
      type: Boolean,
      default: false
    },
    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const {
      state,
      context,
      meta,
      errors,
      items,
      add,
      select,
      selected,
      filter
    } = useClientAddresses();

    if (props.modelValue) {
      select(props.modelValue);
    }

    watch(selected, (newValue, oldValue) => {
      if (isEqual(newValue?.id, oldValue?.id)) return;
      emit("update:modelValue", selected.value?.id);
    });

    return {
      state,
      items,
      selected,
      meta,
      add,
      context,
      errors,
      select,
      filter,
      editing: ref()
    };
  },

  computed: {}
});
</script>
