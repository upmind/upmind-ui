<template>
  <div>
    <div class="flex-1 text-center" v-if="meta.isLoading || meta.isProcessing">
      <span class="loading loading-dots opacity-50"></span>
    </div>
    <template v-else>
      <div
        class="grid grid-cols-3 gap-4"
        :class="meta.isEditing ? 'opacity-50 pointer-events-none' : ''"
      >
        <upm-place
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected="item.id === selected?.id"
          @select="select"
          :class="{
            'border-primary': item.id === selected?.id
            // 'col-span-full': item.id === selected?.id && meta.isEditing
          }"
        />
      </div>

      <upm-place-form
        class="mt-8 shadow border border-neutral"
        :item="selected"
        v-if="meta.isEditing"
        :key="selected.id"
      ></upm-place-form>

      <div class="actions mt-4 flex">
        <button class="btn btn-link btn-sm" @click="add">
          <plus-icon class="w-4 h-4" /> Add new
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
import { PlusIcon } from "@heroicons/vue/24/outline";

export default defineComponent({
  name: "UpmPlaces",
  components: {
    PlusIcon,
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
