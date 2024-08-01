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
        :prependIcon="meta.showPrimaryDomain ? null : 'search'"
        :placeholder="$t('domain.dac.search')"
        autofocus
        autocomplete="url"
        :model-value="query"
      />

      <upm-domain-listings
        v-if="!meta.showPrimaryDomain"
        :model-value="selected"
        :items="available"
        :loading="meta.isSearching"
        :processing="meta.isSyncing"
        @update:modelValue="update"
        @toggle="toggle"
        :multiple="multiple"
      />

      <upw-button
        v-if="meta.showContinue || meta.isSyncing"
        :loading="meta.isSyncing"
        :disabled="!selected.length"
        @click="syncBasket"
        label="Sync"
      />
    </template>

    <!-- existing -->
    <upw-combobox
      v-else-if="meta.showExisting"
      :class="styles.domain.existing"
      :errors="errors"
      :items="ownedDomains"
      :model-value="selected"
      @update:modelValue="update"
      autocomplete="url"
      autofocus
      item-label="domain"
      item-value="value"
      :placeholder="$t('domain.existing.search')"
    />

    <!-- basket -->

    <pre>{{ { state, meta, selected } }}</pre>
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
import { debounce, first, map, reduce } from "lodash-es";

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
  emits: ["update:modelValue"],
  props: {
    sync: { type: Boolean, default: false },
    type: {
      type: String,
      validator: value =>
        ["register", "transfer", "existing", "basket"].includes(value),
    },
    modelValue: { type: [String, Array], default: () => [] },
    multiple: { type: Boolean, default: false },
    parentId: { type: String },

    // ---
  },
  setup(props) {
    const {
      // state,
      // ---
      choices,
      selected,
      type,
      query,
      available,
      errors,
      // ---
      meta,
      state,
      // ---
      choose,
      search,
      update,
      toggle,
      syncBasket,
    } = useDomain({
      values: props.modelValue,
      sync: props.sync,
      type: props.type,
      parentId: props.parentId,
    });
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
      toggle,
      syncBasket,
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

    ownedDomains() {
      return reduce(
        this.available,
        (result, item) => {
          result.push({ ...item, persist: true });
          return result;
        },
        [
          {
            as: "separator",
            persist: true,
            domain: this.$t("domain.existing.owned"),
          },
        ]
      );
    },
  },
  methods: {},
  watch: {
    selected: {
      handler: function (value) {
        if (!this.multiple) {
          this.$emit("update:modelValue", value);
        } else {
          this.$emit(
            "update:modelValue",
            find(value, "is_primary") || first(value)
          );
        }
      },
      deep: true,
    },
  },
});
</script>
.
