<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <!-- type -->
    <upw-radio-list
      v-if="meta.showChoices"
      :items="choices"
      :model-value="type"
      @update:modelValue="choose"
    />

    <!-- register/transfer -->

    <!-- basket -->

    <!-- external -->
  </div>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useDomain } from "@upmind/flow-vue";
import { useStyles, mergeStyles, UpwRadioList } from "@upmind/upwind";
import config from "./config.cva";

// --- components

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomain",
  components: { UpwRadioList },
  props: {
    sync: { type: Boolean, default: true },
    type: {
      type: String,
      validator: value =>
        ["register", "transfer", "existing", "basket"].includes(value),
    },
    parentId: { type: String },
    // ---
    limit: {
      type: Number,
      default: 10,
    },
  },
  setup(props) {
    const {
      // state,
      // ---
      choices,
      // values,
      // selected,
      type,
      // available,
      // errors,
      // primaryDomain,
      // ---
      meta,
      // ---
      choose,
      // search,
      // add,
      // remove,
      // toggle,
      // setPrimaryDomain,
      // isSelected,
      // destroy,
    } = useDomain(props);
    const styles = useStyles(["domain"], meta, config);

    // ---

    return {
      meta,
      choices,
      // ---
      type,
      // ---
      choose,
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},

  methods: {},
});
</script>
.
