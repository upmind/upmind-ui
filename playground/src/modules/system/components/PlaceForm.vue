<template>
  <div class="">
    <upm-form-generator
      v-if="meta.hasAutocomplete && !meta.isLoading"
      :loading="meta.isLoading"
      :processing="meta.isSearching"
      :model-value="autocomplete.model"
      :schema="autocomplete.schema"
      :uischema="autocomplete.uischema"
      @update:modelValue="search"
      class="px-4 py-8"
      no-actions
    />

    <div class="divider mx-6" v-if="meta.hasAutocomplete && !meta.isLoading">
      Or enter address manually
    </div>

    <upm-form-generator
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      @update:modelValue="input"
      @reject="clear"
      @resolve="update"
      class="p-4"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSystemPlace } from "..";
import { UpmFormGenerator } from "@upmind/components";

export default defineComponent({
  name: "UpmPlaceForm",
  components: { UpmFormGenerator },
  props: {
    item: {
      type: Object, // xstate actor
      required: true
    },

    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const {
      state,
      context,
      meta,
      errors,
      model,
      schema,
      uischema,
      autocomplete,
      input,
      search,
      update,
      clear
    } = useSystemPlace(props.item);

    return {
      state,
      context,
      meta,
      errors,
      model,
      schema,
      uischema,
      autocomplete,
      input,
      search,
      update,
      clear
    };
  },

  computed: {}
});
</script>
