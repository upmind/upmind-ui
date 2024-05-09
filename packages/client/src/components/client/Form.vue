<template>
  <div tabindex="0" ref="form" :class="styles.clientForm.root">
    <h4 :class="styles.clientForm.title">{{ model?.name || "New Phone" }}</h4>

    <upw-form
      :class="styles.clientForm.form"
      tabindex="1"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      @update:modelValue="input"
      @reject="cancel"
      @resolve="update"
    />
  </div>

  <pre>{{ meta }}</pre>
</template>

<script>
// --- external
import { defineComponent, inject, ref } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwForm } from "@upmind/upwind";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmPhoneForm",
  components: { UpwForm },
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },
  },
  setup(props) {
    const useClient = inject("client");
    const clientForm = useClient(props.item);
    const styles = useStyles(["clientForm"], clientForm.meta, config);

    return {
      form: ref(),
      styles,
      ...clientForm,
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
  },
});
</script>
