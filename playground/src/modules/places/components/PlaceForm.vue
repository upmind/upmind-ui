<template>
  <div
    tabindex="0"
    ref="form"
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? '  border-error' : '',
      meta.isComplete ? ' card-bordered border-primary' : ''
    ]"
  >
    <div class="card-body">
      <h3 class="text-center">{{ model.name }}</h3>

      <template v-if="meta.hasAutocomplete && !meta.isLoading && meta.isNew">
        <upm-form-generator
          tabindex="0"
          :loading="meta.isLoading"
          :processing="meta.isSearching"
          :model-value="autocomplete.model"
          :schema="autocomplete.schema"
          :uischema="autocomplete.uischema"
          @update:modelValue="search"
          class="px-4 gap-4"
          no-actions
        />

        <div class="divider mx-6">Or enter address manually</div>
      </template>

      <upm-form-generator
        tabindex="1"
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="input"
        @reject="cancel"
        @resolve="update"
        class="p-4 gap-8"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { usePlace } from "..";
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
      cancel
    } = usePlace(props.item);

    return {
      form: ref(),
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
      cancel
    };
  },

  computed: {},
  mounted() {
    this.$nextTick(() => {
      const yOffset = -108;
      const y =
        this.form.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });

      this.form.focus();
    });
  }
});
</script>
