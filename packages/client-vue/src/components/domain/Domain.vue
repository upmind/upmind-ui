<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <!-- type -->
    <upw-radio-list
      :class="styles.domain.choices"
      v-if="meta.showChoices"
      :items="choices"
      :model-value="choice"
      @update:modelValue="choose"
    />

    <!-- register/transfer -->
    <template v-if="meta.showDac">
      <upw-textbox
        :key="choice"
        :class="styles.domain.search"
        @update:modelValue="search"
        prependIcon="search"
        placeholder="Search for your domain &hellip;"
        autofocus
        autocomplete="url"
        :model-value="query"
      />

      <upm-domain-listings
        :model-value="selected"
        :items="available"
        :loading="meta.isSearching"
        :processing="meta.isSyncing"
        @update:modelValue="update"
        :multiple="multiple"
      />
    </template>

    <!-- external -->

    <upw-combobox
      v-else-if="meta.showExisting"
      :class="styles.domain.existing"
      :errors="errors"
      :items="available"
      :model-value="selected"
      @update:modelValue="update"
      autocomplete="url"
      autofocus
      item-label="domain"
      item-value="value"
      placeholder="Enter your domain &hellip;"
      prependIcon="domain-search"
    />

    <!-- basket -->

    <pre>{{ { state, errors, meta } }}</pre>
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
  UpwCombobox,
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
  components: {
    UpwRadioList,
    UpwTextbox,
    UpwButton,
    UpwCombobox,
    UpmDomainListings,
  },
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
      errors,
      // primaryDomain,
      // ---
      meta,
      state,
      // ---
      choose,
      search,
      update,
      // remove,
      // setPrimaryDomain,
      // isSelected,
      // destroy,
    } = useDomain(props);
    const styles = useStyles(["domain"], meta, config);

    // ---

    return {
      state,
      meta,
      choices,
      selected,
      available,
      errors,
      // ---
      choice: type,
      query,
      // ---
      choose,
      search: debounce(search, 500),
      update: debounce(update, 500),
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
