<template>
  <component :is="tag" v-html="sanitized" />
</template>

<script>
import { defineComponent } from "vue";
import dompurify from "dompurify";

export default defineComponent({
  name: "Uwpw-Sanitized",
  props: {
    tag: { type: String, default: "span" },
    modelValue: { type: String, required: true },
  },
  computed: {
    sanitized() {
      // See https://github.com/cure53/DOMPurify for options
      // We add attr 'target' so blank links will work from render templates
      return dompurify.sanitize(this.modelValue, { ADD_ATTR: ["target"] });
    },
  },
});
</script>
