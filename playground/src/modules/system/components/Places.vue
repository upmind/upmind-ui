<template>
  <div>
    <div class="flex-1 text-center" v-if="meta.isLoading || meta.isProcessing">
      <span class="loading loading-dots opacity-50"></span>
    </div>
    <div class="grid grid-cols-3 gap-4" v-else>
      <upm-place
        v-for="item in items"
        :key="item.id"
        :item="item"
        :selected="item.id === selected?.id"
        @select="select"
      />

      <!-- <upm-place-form :item="selected" v-if="selected"></upm-place-form> -->
    </div>
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
import { defineComponent } from "vue";
import { useSystemPlaces } from "..";
import UpmPlace from "../components/Place.vue";
import UpmPlaceForm from "../components/Place.vue";
import { UpmDebug } from "@upmind/components";

export default defineComponent({
  name: "UpmPlaces",
  components: {
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
      select
    };
  },

  computed: {}
});
</script>
