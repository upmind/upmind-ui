<template>
  <div :class="styles.domain.root">
    <!-- loader -->
    <!-- <pre>{{ meta }}</pre> -->

    <!-- type -->
    <upw-radio-list
      :class="styles.domain.choices"
      v-if="meta.showChoices"
      :items="choices"
      :model-value="choice"
      @update:modelValue="choose"
    />

    <!-- register/transfer -->
    <upw-textbox
      v-if="meta.showRegister || meta.showTransfer"
      :class="styles.domain.search"
      @update:modelValue="search"
      prependIcon="search"
      placeholder="Search for your domain &hellip;"
      autofocus
      autocomplete="url"
      :model-value="query"
    />

    <!-- basket -->

    <!-- external -->

    <!-- INPUT -->
    <upm-domain-listings
      v-if="meta.showRegister || meta.showTransfer"
      :model-value="selected"
      :items="available"
      :loading="meta.isSearching"
      :processing="meta.isSyncing"
      @update:modelValue="doSelect"
      :multiple="multiple"
    />

    <pre>{{ meta }}</pre>
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
import UpmDomainListings from "./Listings.vue";

// --- utils
import { debounce } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomain",
  components: { UpwRadioList, UpwTextbox, UpwButton, UpmDomainListings },
  props: {
    sync: { type: Boolean, default: false },
    type: {
      type: String,
      validator: value =>
        ["register", "transfer", "existing", "basket"].includes(value),
    },
    parentId: { type: String },
    multiple: { type: Boolean, default: true },
    // ---
  },
  setup(props) {
    const {
      // state,
      // ---
      choices,
      // values,
      selected,
      type,
      query,
      available,
      // errors,
      // primaryDomain,
      // ---
      meta,
      // ---
      choose,
      search,
      update,
      toggle,
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
      selected,
      available,
      // ---
      choice: type,
      query,
      // ---
      choose,
      search: debounce(search, 500),
      update,
      toggle,
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},

  methods: {
    doSelect(value) {
      this.update(value);
    },
  },
});
</script>
.
