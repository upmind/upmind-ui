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
      <h3 class="text-center">Email</h3>

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
import { useClientEmail } from "..";
import { UpmFormGenerator } from "@upmind/components";

export default defineComponent({
  name: "UpmEmailForm",
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
      input,
      update,
      cancel
    } = useClientEmail(props.item);

    return {
      form: ref(),
      state,
      context,
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
