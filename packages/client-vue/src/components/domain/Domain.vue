<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <SkeletonList v-if="meta.isLoading" :rows="3" />

    <template v-else>
      <!-- type -->
      <RadioCards
        :class="styles.domain.choices"
        v-if="meta.showChoices"
        :items="i18nChoices"
        :model-value="choice"
        @update:modelValue="choose"
        required
      />

      <!-- register/transfer -->
      <template v-if="meta.showDac">
        <Dac
          :id="`dac-${choice}`"
          :key="`dac-${choice}`"
          :complete="meta.showPrimaryDomain"
          :disabled="!meta.isValid"
          :items="available"
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
      <FormField
        v-else-if="meta.showExisting"
        :class="styles.domain.existing"
        :errors="errors"
        id="existing-domain"
      >
        <Autocomplete
          :items="ownedDomains"
          :model-value="selected"
          @update:modelValue="update"
          autocomplete="url"
          autoFocus
          item-label="domain"
          item-value="value"
          :placeholder="t('domain.existing.search')"
          width="full"
        />
      </FormField>

      <!-- basket -->

      <DomainValues
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
import { useI18n } from "vue-i18n";

// --- internal
import { useDomain } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import Dac from "./Dac.vue";
import DomainValues from "./Values.vue";
import {
  RadioCards,
  SkeletonList,
  Autocomplete,
  FormField,
} from "@upmind/upwind";

// --- utils
import { debounce, map } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Domain",
  components: {
    Autocomplete,
    RadioCards,
    Dac,
    DomainValues,
    SkeletonList,
    FormField,
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
    const { t, tm, rt } = useI18n();

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
      t,
      tm,
      rt,
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
        const i18n = this.tm(`domain.choices.${choice.value}`);
        return {
          ...choice,
          label: this.rt(i18n.label) || choice.label,
        };
      });
    },

    ownedDomains() {
      if (!this.owned?.length) return [];
      return [
        {
          as: "separator",
          persist: true,
          domain: this.t("domain.existing.owned"),
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
