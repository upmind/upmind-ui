<template>
  <div
    v-if="meta.canAdd"
    tabindex="0"
    ref="form"
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? '  border-error' : '',
      meta.isComplete ? ' card-bordered border-primary' : ''
    ]"
  >
    <div class="card-body">
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
  <div v-else>Cannot Add item to list</div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useLookupItem } from "@upmind/vue";
import { UpmFormGenerator } from "@upmind/ui";

export default defineComponent({
  name: "UpmLookupForm",
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
  setup(props, context) {
    const { meta, errors, model, schema, uischema, input, update, cancel } =
      useLookupItem(props, context);

    return {
      form: ref(),
      meta,
      errors,
      model,
      schema,
      uischema,
      input,
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

      // this.form.focus();
    });
  }
});
</script>
..
