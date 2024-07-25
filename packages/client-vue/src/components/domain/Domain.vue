<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <pre>{{ meta }}</pre>

    <!-- type -->
    <upw-radio-list
      v-if="meta.showChoices"
      :items="choices"
      :model-value="choice"
      @update:modelValue="choose"
    />

    <!-- register/transfer -->
    <upw-textbox
      v-if="meta.showRegister"
      @update:modelValue="search"
      prependIcon="MagnifyingGlassIcon"
      placeholder="Find your pefect domain &hellip;"
      :autofocus="meta.showRegister"
      autocomplete="url"
      :model-value="query"
    >
      <template #append>
        <upw-button
          label="Find"
          :loading="meta.isSearching"
          variant="ghost"
          size="sm"
        />
      </template>
    </upw-textbox>

    <upw-textbox
      v-if="meta.showTransfer"
      @update:modelValue="search"
      prependIcon="MagnifyingGlassIcon"
      placeholder="Search for the domain to Transfer &hellip;"
      :autofocus="meta.showTransfer"
      autocomplete="url"
    >
      <template #append>
        <upw-button label="Search" :loading="meta.isSearching" />
      </template>
    </upw-textbox>

    <!-- basket -->

    <!-- external -->
  </div>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useDomain } from "@upmind/flow-vue";
import {
  useStyles,
  mergeStyles,
  UpwRadioList,
  UpwTextbox,
  UpwButton,
} from "@upmind/upwind";
import config from "./config.cva";

// --- components

// --- utils
import { debounce } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomain",
  components: { UpwRadioList, UpwTextbox, UpwButton },
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
      query,
      // available,
      // errors,
      // primaryDomain,
      // ---
      meta,
      // ---
      choose,
      search,
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
      choice: type,
      query,
      // ---
      choose,
      search: debounce(search, 500),

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
