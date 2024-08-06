<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <upw-skeleton-list
      :class="styles.domain.listings.loading"
      v-if="meta.isLoading"
    />
    <template v-else>
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
        <upm-dac
          :complete="meta.showPrimaryDomain"
          :continue="meta.showContinue"
          :items="available"
          :key="type"
          :loading="meta.isSearching"
          :model-value="selected"
          :processing="meta.isSyncing"
          :values="values"
          @search="search"
          @toggle="toggle"
          @resolve="syncBasket"
          @reject="reset"
          :query="meta.showPrimaryDomain ? selected : query"
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

      <upm-domain-values
        v-if="meta.showBasket"
        :model-value="selected"
        :items="available"
        :loading="meta.isSearching"
        :processing="meta.isSyncing"
        @update:modelValue="setPrimaryDomain"
      />
    </template>

    <!-- <pre>{{ { state, meta, selected, values } }}</pre> -->
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
  UpwCombobox,
  UpwSkeletonList,
} from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmDac from "./Dac.vue";
import UpmDomainValues from "./Values.vue";

// --- utils
import { debounce, first, map, reduce } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomain",
  components: {
    UpwRadioList,
    UpwCombobox,
    UpmDac,
    UpmDomainValues,
    UpwSkeletonList,
  },
  emits: ["update:modelValue", "change"],
  props: {
    sync: { type: Boolean, default: true },
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
      values,
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
      reset,
      syncBasket,
      setPrimaryDomain,
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
      values,
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
      reset,
      syncBasket,
      setPrimaryDomain,
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
      const owned = [];
      if (this.available?.length) {
        owned.push({
          as: "separator",
          persist: true,
          domain: this.$t("domain.existing.owned"),
        });
      }
      return reduce(
        this.available,
        (result, item) => {
          result.push({ ...item, persist: true });
          return result;
        },
        owned
      );
    },
  },
  methods: {},
  watch: {
    selected: {
      handler: function (value) {
        this.$emit("update:modelValue", value);
        // forward the event to our form renderers that will trigger the update
        // NB: this is not a DOM event so we need to fake one for the renderer
        this.$emit("change", { currentTarget: { value } });
      },
    },
  },
});
</script>
.
