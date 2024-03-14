<template>
  <i v-if="icon" class="icon flex" v-html="icon" />
</template>

<script>
import { defineComponent, ref, watchEffect } from "vue";
export default defineComponent({
  name: "UpmIcon",
  props: {
    path: String,
    name: { type: String, required: true },
    filled: { type: Boolean, default: false },
    avatar: { type: Boolean, default: false },
  },
  setup(props) {
    const icon = ref(null);

    watchEffect(async () => {
      try {
        const iconsImport = import.meta.glob("@/assets/icons/**/*.svg", {
          as: "raw",
          eager: false,
        });

        const safePath = props.path ? `${props.path}/` : "";

        const rawIcon =
          await iconsImport[`/src/assets/icons/${safePath}${props.name}.svg`]();
        icon.value = rawIcon;
      } catch {
        icon.value = null;
      }
    });

    return {
      icon,
    };
  },
});
</script>

<style lang="scss">
.icon {
  > svg {
    width: 100%;
    height: 100%;
  }
}
</style>
