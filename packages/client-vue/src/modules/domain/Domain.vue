<template>
  <div :class="styles.domain.root">
    <!-- loader -->
    <SkeletonList v-if="meta.isLoading" :rows="3" />

    <template v-else>
      <!-- type -->
      <RadioGroup :modelValue="type">
        <Accordion type="multiple" collapsible :class="styles.domain.form.root">
          <AccordionItem
            v-for="item in i18nChoices"
            :key="item.value"
            :value="item.value"
            :class="styles.domain.form.item"
            :disabled="isSelected(item.value)"
            :open="isSelected(item.value)"
          >
            <AccordionTrigger
              :class="styles.domain.form.trigger.root"
              @click="choose(item.value)"
            >
              <label :class="styles.domain.form.trigger.label">
                <span :class="styles.domain.form.trigger.radio">
                  <div
                    class="absolute inset-0 z-10 cursor-pointer"
                    @click="choose(item.value)" />
                  <RadioGroupItem
                    :id="item.value"
                    :value="item.value"
                    :checked="isSelected(item.value)"
                    tabindex="-1"
                    disabled
                    class="relative !cursor-pointer !opacity-100" /></span
                >{{ item.label }}
              </label>
              <template #icon><span /></template>
            </AccordionTrigger>

            <AccordionContent
              :class="styles.domain.form.content.root"
              :content-class="styles.domain.form.content.container"
            >
              <!-- register/transfer -->
              <Dac
                v-if="meta.showDac"
                :id="`dac-${type}`"
                :key="`dac-${type}`"
                :complete="meta.showSelected"
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
                @remove="remove"
                @resolve="addToBasket"
                @reject="reset"
                @reset="reset"
                :query="meta.showSelected ? selected : query"
                :color="color"
                :type="type"
              />

              <!-- existing -->
              <FormControl
                v-else-if="meta.showExisting"
                autoFocus
                :formItemId="`dac-${type}`"
                :animation-delay="300"
              >
                <Input
                  :class="styles.domain.existing"
                  :model-value="selected"
                  @update:modelValue="update($event.toString())"
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
                @update:modelValue="select"
              />
              <div v-auto-animate>
                <FormMessage
                  v-if="props.errors && props.touched"
                  :errors="props.errors"
                  :class="styles.domain.form.error"
                  formMessageId="domain-error-message"
                  name="domain"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </RadioGroup>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, watch, onBeforeUnmount, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";
// --- internal
import { useDomain } from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./domain.config";

// --- components
import Dac from "./components/Dac.vue";
import DomainBasketCards from "./components/DomainBasketCards.vue";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  SkeletonList,
  Input,
  FormControl,
  FormMessage,
  RadioGroup,
  RadioGroupItem,
} from "@upmind-automation/upmind-ui";

// --- utils
import { map } from "lodash-es";
import { DomainTypes } from "@upmind-automation/headless-vue";

// --- types
import type { DomainProps } from "./types";

// -----------------------------------------------------------------------------
const emit = defineEmits<{
  (e: "update:modelValue", value: string | string[]): void;
  (e: "update:type", value: string): void;
}>();

const props = withDefaults(defineProps<DomainProps>(), {
  type: DomainTypes.register,
  modelValue: "",
  color: "secondary",
});
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
  addToBasket,
  select,
  remove,
} = useDomain({
  model: props.modelValue,
  type: props.type,
});

const styles = useStyles(
  ["domain", "domain.form", "domain.form.trigger", "domain.form.content"],
  meta,
  config
) as ComputedRef<{
  domain: {
    root: string;
    choices: string;
    existing: string;
    basket: string;
    form: {
      root: string;
      trigger: {
        root: string;
        label: string;
        radio: string;
      };
      content: {
        root: string;
        container: string;
      };
      item: string;
      error: string;
    };
    trigger: {
      root: string;
    };
  };
}>;
// ---

const i18nChoices = computed(() => {
  return map(choices.value, (choice, index) => {
    const translations: { label: string } = tm(
      `domain.choices.${choice.label}`
    );
    return {
      value: choice.label,
      label: rt(translations?.label) || choice.label,
      item: choice,
      index,
      modelValue: choice.value,
    };
  });
});

const isSelected = (value: string) => {
  return value == type.value;
};

const ownedDomains = computed(() => {
  if (!owned.value?.length) return [];
  return [
    {
      as: "separator",
      persist: true,
      domain: t("domain.existing.owned"),
    },
    ...owned.value,
  ];
});

// --- lifecycle
onBeforeUnmount(() => {
  destroy();
});

// --- side effects

watch(selected, value => {
  choose(value);
  emit("update:type", value);
});
</script>
