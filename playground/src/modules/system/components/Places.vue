<template>
  <div class="grid gap-4">
    <div
      class="col-span-full text-center"
      v-if="meta.isLoading || meta.isProcessing"
    >
      <span class="loading loading-dots opacity-50"></span>
    </div>
    <template v-else>
      <upm-place
        v-for="item in items"
        :key="item.id"
        :item="item"
        :selected="item.id === selected?.id"
        @select="select"
        :class="[
          meta.isEditing ? 'opacity-50 pointer-events-none' : '',
          {
            'border-primary': item.id === selected?.id
            // 'col-span-full': item.id === selected?.id && meta.isEditing
          }
        ]"
      />

      <upm-place-form
        class="mt-8 shadow border border-neutral col-span-full"
        :item="selected"
        v-if="meta.isEditing"
        :key="selected.id"
      ></upm-place-form>

      <div
        class="actions flex justify-center items-center bg-neutral bg-opacity-5 rounded-box py-16"
      >
        <button class="btn btn-ghost" @click="add">
          <squares-plus-icon class="w-6 h-6" /> Add new
        </button>
      </div>
    </template>
    <upm-debug
      v-if="debugging"
      title="SystemPlaces"
      :state="state"
      :context="context"
      :errors="errors"
      :meta="meta"
      class="mt-8"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useSystemPlaces } from "..";
import UpmPlace from "../components/Place.vue";
import UpmPlaceForm from "../components/PlaceForm.vue";
import { UpmDebug } from "@upmind/components";
import { PlusIcon, SquaresPlusIcon } from "@heroicons/vue/24/outline";

export default defineComponent({
  name: "UpmPlaces",
  components: {
    PlusIcon,
    SquaresPlusIcon,
    UpmPlace,
    UpmPlaceForm,
    UpmDebug
  },
  props: {
    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { state, context, meta, errors, items, add, select, selected } =
      useSystemPlaces();

    return {
      state,
      items,
      selected,
      meta,
      add,
      context,
      errors,
      select,
      editing: ref()
    };
  },

  computed: {}
});
</script>
