<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <UpwSkeletonList v-if="meta.isLoading" :rows="3" />

    <template v-else>
      <!-- type -->
      <UpwRadioList
        :class="styles.domain.choices"
        v-if="meta.showChoices"
        :items="i18nChoices"
        :model-value="choice"
        @update:modelValue="choose"
      />

      <!-- register/transfer -->
      <template v-if="meta.showDac">
        <UpmDac
          :complete="meta.showPrimaryDomain"
          :disabled="!meta.isValid"
          :items="available"
          :key="type"
          :loading="meta.isSearching"
          :model-value="selected"
          :more="meta.hasMoreSearchResults"
          :offset="searchOffset"
          :processing="meta.isSyncing"
          :values="model"
          @search="search"
          @search:more="searchMore"
          @toggle="toggle"
          @resolve="syncBasket"
          @reject="reset"
          :query="meta.showPrimaryDomain ? selected : query"
        />
      </template>

      <!-- existing -->
      <UpwCombobox
        v-else-if="meta.showExisting"
        :class="styles.domain.existing"
        :errors="errors"
        :items="ownedDomains"
        v-model="selected"
        @update:modelValue="update"
        autocomplete="url"
        autofocus
        item-label="domain"
        item-value="value"
        :searchPlaceholder="$t('domain.existing.search')"
      />

      <!-- basket -->

      <UpmDomainValues
        v-if="meta.showBasket"
        :model-value="selected"
        :items="basket"
        :loading="meta.isSearching"
        :processing="meta.isSyncing"
        @update:modelValue="setPrimaryDomain"
      />
    </template>
  </div>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useDomain } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmDac from "./Dac.vue";
import UpmDomainValues from "./Values.vue";
import { UpwRadioList, UpwSkeletonList, UpwCombobox } from "@upmind/upwind";

// --- utils
import { debounce, map } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomain",
  components: {
    UpwCombobox,
    UpwRadioList,
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
      model,
      type,
      query,
      available,
      owned,
      basket,
      errors,
      // ---
      meta,
      state,
      searchOffset,
      // ---
      choose,
      search,
      searchMore,
      update,
      toggle,
      reset,
      destroy,
      syncBasket,
      setPrimaryDomain,
    } = useDomain({
      model: props.modelValue,
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
      model,
      available,
      owned,
      basket,
      errors,
      // ---
      choice: type,
      query,
      // ---
      choose,
      search: debounce(search, 500),
      searchMore,
      searchOffset,
      update,
      toggle,
      reset,
      syncBasket,
      setPrimaryDomain,
      destroy,
      // ---
      styles,
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
      if (!this.owned?.length) return [];
      return [
        {
          as: "separator",
          persist: true,
          domain: this.$t("domain.existing.owned"),
        },
        ...this.owned,
      ];
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
  beforeUnmount() {
    this.destroy();
  },
});
</script>
.
