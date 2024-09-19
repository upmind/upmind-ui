<template>
  <upw-sanitized :key="compiledMarkdown" :modelValue="compiledMarkdown" />
</template>

<script>
import { defineComponent } from "vue";
import { marked } from "marked";
import UpwSanitized from "../sanitized/Sanitized.vue";

export default defineComponent({
  name: "Uwpw-Markdown",
  emits: ["mounted"],
  components: { UpwSanitized },
  props: {
    modelValue: { type: String },
  },
  computed: {
    compiledMarkdown() {
      const modelValue =
        this.$slots?.default?.[0]?.modelValue || this.modelValue;
      return marked(modelValue);
    },
  },
  created() {
    marked.setOptions({
      breaks: true,
    });
  },
  mounted() {
    this.$emit("mounted");
  },
});
</script>
