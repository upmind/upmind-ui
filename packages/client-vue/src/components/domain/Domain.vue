<template>
  <div :class="styles.domain.root">
    <!-- loader -->

    <SkeletonList v-if="meta.isLoading" :rows="3" />

    <template v-else>
      <!-- type -->
      <RadioCards
        v-if="meta.showChoices"
        id="domain-type"
        name="domain-type"
        :class="styles.domain.choices"
        :items="i18nChoices"
        :model-value="type"
        @update:modelValue="choose"
        required
      />

      <!-- register/transfer -->
      <template v-if="meta.showDac">
        <Dac
          :id="`dac-${type}`"
          :key="`dac-${type}`"
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
          @update:selected="toggle"
          @resolve="syncBasket"
          @reject="reset"
          :query="meta.showPrimaryDomain ? selected : query"
          :color="color"
        />
      </template>

      <!-- existing -->

      <FormControl
        v-else-if="meta.showExisting"
        autoFocus
        :formItemId="`dac-${type}`"
      >
        <Input
          :class="styles.domain.existing"
          :model-value="selected"
          @update:modelValue="update"
          autocomplete="url"
          :placeholder="t('domain.existing.search')"
          width="full"
          :list="ownedDomains"
        />
      </FormControl>

      <!-- basket -->

      <DomainBasketCards
        v-else-if="meta.showBasket"
        :class="styles.domain.basket"
        :model-value="selected"
        :items="basket"
        :loading="meta.isSearching"
        :processing="meta.isSyncing"
        @update:modelValue="setPrimaryDomain"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, watch, onBeforeUnmount, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useDomain } from "@upmind-automation/headless-vue";
import { useStyles, type ButtonProps } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import Dac from "./Dac.vue";
import DomainBasketCards from "./DomainBasketCards.vue";
import {
  RadioCards,
  SkeletonList,
  Input,
  FormControl,
} from "@upmind-automation/upmind-ui";

// --- utils
import { map } from "lodash-es";
import { DomainTypes } from "@upmind-automation/headless";

// --- types

// -----------------------------------------------------------------------------
// const emit = defineEmits(["update:modelValue"]);
const emit = defineEmits<{
  (e: "update:modelValue", value: string | string[]): void;
}>();

const props = withDefaults(
  defineProps<{
    sync?: boolean;
    type?: DomainTypes;
    modelValue?: string;
    multiple?: boolean;
    parentId?: string;
    color?: ButtonProps["color"];
  }>(),
  {
    sync: true,
    type: DomainTypes.register,
    modelValue: "",
    multiple: false,
    parentId: "",
    color: "secondary",
  }
);
const { t, tm, rt } = useI18n();

const {
  choices,
  type,
  selected,
  model,
  query,
  available,
  owned,
  basket,
  errors,
  // ---
  state,
  meta,
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

const styles = useStyles(["domain"], meta, config) as ComputedRef<{
  domain: {
    root: string;
    choices: string;
    existing: string;
    basket: string;
  };
}>;

// ---

const i18nChoices = computed(() => {
  return map(choices.value, choice => {
    const translations: { label: string } = tm(
      `domain.choices.${choice.value}`
    );
    return {
      ...choice,
      label: rt(translations?.label) || choice.label,
    };
  });
});

const ownedDomains = computed(() => {
  if (!owned?.length) return [];
  return [
    {
      as: "separator",
      persist: true,
      domain: t("domain.existing.owned"),
    },
    ...owned,
  ];
});

// --- lifecycle
onBeforeUnmount(() => {
  destroy();
});

// --- side effects

watch(selected, value => {
  choose(value);
  emit("update:modelValue", value);
});
</script>
.
