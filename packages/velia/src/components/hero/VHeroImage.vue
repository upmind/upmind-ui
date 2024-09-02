<template>
  <div :style="backgroundImage" class="bg-cover bg-center pb-16 md:pb-64">
    <slot />
  </div>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import coverImage from "../../assets/cover.jpeg";

export default defineComponent({
  setup() {
    const backgroundImage = ref({
      backgroundImage: `linear-gradient(rgba(20, 46, 77, 0.75), rgba(20, 46, 77, 1)), url(${coverImage})`,
    });

    return {
      backgroundImage,
    };
  },
});
</script>
