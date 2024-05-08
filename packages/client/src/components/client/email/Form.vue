<template>
  <div tabindex="0" ref="form" :class="styles.clientForm.root">
    <h4 :class="styles.clientForm.title">{{ model?.name || "New Email" }}</h4>

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
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useClientEmail } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "../config.cva";

// --- components
import { UpwForm } from "@upmind/upwind";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmEmailForm",
  components: { UpwForm },
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },
  },
  setup(props) {
    const clientEmail = useClientEmail(props.item);
    const styles = useStyles(["clientForm"], clientEmail.meta, config);

    return {
      form: ref(),
      styles,
      ...clientEmail,
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
