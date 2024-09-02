<template>
  <div :style="backgroundImage" class="pb-16">
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
      backgroundImage: `linear-gradient(rgba(20, 46, 77, 0.5), rgba(20, 46, 77, 1)), url(${coverImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    });

    return {
      backgroundImage,
    };
  },
});
</script>
