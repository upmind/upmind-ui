<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <!-- type -->
    <upw-radio-list
      :class="styles.domain.choices"
      v-if="meta.showChoices"
      :items="i18nChoices"
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
        :placeholder="$t('domain.dac.search')"
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
      :placeholder="$t('domain.existing.search')"
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
import { debounce, map } from "lodash-es";

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
  computed: {
    i18nChoices() {
      return map(this.choices, choice => {
        const i18n = this.$tm(`domain.choices.${choice.value}`);
        return {
          ...choice,
          label: this.$rt(i18n.label) || choice.label,
        };
      });
    },
  },

  methods: {},
});
</script>
.
