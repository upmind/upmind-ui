<template>
  <div :class="styles.domain.root">
    <!-- loader -->
    <SkeletonList v-if="meta.isLoading" :rows="3" />

    <template v-else>
      <!-- type -->
      <RadioGroup v-model="type">
        <Accordion type="multiple" collapsible :class="styles.domain.form.root">
          <AccordionItem
            v-for="item in mappedChoices"
            :key="item.value"
            :value="item.value"
            :class="styles.domain.form.item"
            :disabled="isSelected(item.value)"
            :open="isSelected(item.value)"
          >
            <AccordionTrigger
              :class="styles.domain.form.trigger.root"
              @click="onSelect(item.value)"
            >
              <label :class="styles.domain.form.trigger.label">
                <span :class="styles.domain.form.trigger.radio">
                  <RadioGroupItem
                    :id="item.value"
                    :value="item.value"
                    :checked="isSelected(item.value)"
                    tabindex="-1"
                    disabled
                    class="relative cursor-pointer! opacity-100!"
                /></span>
                {{ item.label }}
              </label>
              <template #icon><span /></template>
            </AccordionTrigger>

            <AccordionContent
              :key="`content-${item.value}-${type}`"
              :class="styles.domain.form.content.root"
              :content-class="styles.domain.form.content.container"
            >
              <!-- register/transfer -->
              <FormControl
                v-if="meta.showDac && type === 'register'"
                :invalid="false"
                :formItemId="`dac-${type}`"
                key="dac-register"
                :auto-focus="shouldAutoFocus"
              >
                <Input
                  v-model="query"
                  :prependIcon="meta.showSelected ? null : 'search'"
                  :placeholder="t('form.domain_search.placeholder')"
                  autocomplete="url"
                  :disabled="disabled"
                />
              </FormControl>

              <FormControl
                v-if="meta.showDac && type === 'transfer'"
                :invalid="false"
                :formItemId="`dac-${type}`"
                key="dac-transfer"
                :auto-focus="shouldAutoFocus"
              >
                <Input
                  v-model="query"
                  :prependIcon="meta.showSelected ? null : 'search'"
                  :placeholder="t('form.domain_search.placeholder')"
                  autocomplete="url"
                  :disabled="disabled"
                />
              </FormControl>

              <!-- existing -->
              <FormControl
                v-else-if="meta.showExisting"
                :formItemId="`dac-${type}`"
                key="dac-existing"
                :auto-focus="shouldAutoFocus"
              >
                <Input
                  v-model="modelValue"
                  autocomplete="url"
                  :placeholder="t('form.domain.placeholder')"
                  width="full"
                  :list="ownedDomains"
                  class="bg-base-background"
                  :disabled="disabled"
                />
              </FormControl>

              <!-- basket -->
              <FormControl
                v-else-if="meta.showBasket"
                key="basket"
                :auto-focus="shouldAutoFocus"
                :formItemId="`dac-${type}`"
              >
                <Select
                  v-model="selected"
                  :items="basketDomains"
                  :loading="meta.isSearching"
                  :processing="meta.isProcessing"
                  :disabled="disabled"
                  required
                />
              </FormControl>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </RadioGroup>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";

// --- components
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  SkeletonList,
  Select,
  Input,
  FormControl,
  RadioGroup,
  RadioGroupItem
} from "@upmind-automation/upmind-ui";

// --- utils

import { map } from "lodash-es";

// --- types

import { DomainTypes, type UseDomain } from "@upmind-automation/headless";
import type { SelectItemProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  choices?: UseDomain["choices"]["value"];
  owned?: UseDomain["owned"]["value"];
  basket?: UseDomain["basket"]["value"];
  type?: UseDomain["type"]["value"];
  query?: UseDomain["query"]["value"];
  selected?: UseDomain["model"]["value"];
  modelValue?: UseDomain["model"]["value"];
  // ---
  loading?: boolean;
  processing?: boolean;
  disabled?: boolean;
  searching?: boolean;
  valid?: boolean;
  // ---
  showSearchResults?: boolean;
  showSelected?: boolean;
  showBasket?: boolean;
  showDac?: boolean;
  showExisting?: boolean;
}>();

// NB: we keep modelvalue and select separate as they need to trigger different updates in the parent
// even thought they have the same value
const modelValue = defineModel<UseDomain["model"]["value"]>("modelValue");
const selected = defineModel<UseDomain["model"]["value"]>("selected");
const query = defineModel<UseDomain["query"]["value"]>("query");
const type = defineModel<UseDomain["type"]["value"]>("type");

// -----------------------------------------------------------------------------

const { t, tm, rt } = useI18n();

const stylesMeta = computed(() => ({
  isDisabled: props.disabled || props.processing
}));

const styles = useStyles(
  ["domain", "domain.form", "domain.form.trigger", "domain.form.content"],
  stylesMeta,
  config
);

const meta = computed(() => ({
  isLoading: props.loading ?? false,
  isProcessing: props.processing ?? false,
  isSearching: props.searching ?? false,
  showSelected: props.showSelected ?? false,
  showBasket: props.showBasket ?? false,
  showDac: props.showDac ?? false,
  showExisting: props.showExisting ?? false,
  isValid: props.valid ?? false,
  showSearchResults: props.showSearchResults ?? false
}));

const mappedChoices = computed(() => {
  return map(props.choices, (choice, index) => {
    const translations: { label: string } = tm(
      `domain.choices.${choice.label}`
    );
    return {
      value: choice.label,
      label: rt(translations?.label) || choice.label,
      item: choice,
      index,
      modelValue: choice.value
    };
  });
});

function isSelected(value: string) {
  return value == props.type;
}

const shouldAutoFocus = ref(false);

function onSelect(value: DomainTypes) {
  if (value !== props.type) {
    shouldAutoFocus.value = true;
  }
  type.value = value;
}

const ownedDomains = computed(() => {
  if (!props.owned?.length) return [];
  return [
    {
      as: "separator",
      persist: true,
      domain: t("domain.owned_domains_title")
    },
    ...props.owned
  ];
});

const basketDomains = computed((): SelectItemProps[] => {
  return map(props.basket, (item, index) => ({
    index,
    item: item,
    modelValue: selected.value,
    value: item.domain?.toString(),
    label: item.domain
  }));
});
</script>
