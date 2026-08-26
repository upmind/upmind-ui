<template>
  <div :class="domainRootVariants()">
    <!-- loader -->
    <div v-if="meta.isLoading" class="flex flex-col gap-2">
      <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
    </div>

    <template v-else>
      <!-- type -->
      <RadioGroup
        :model-value="type"
        :items="mappedChoices"
        :class="domainFormRootVariants(formMeta)"
        :ui="{
          item: domainFormItemVariants(formMeta),
          option: [
            domainFormTriggerRootVariants(),
            domainFormTriggerLabelVariants()
          ],
          control: domainFormTriggerRadioVariants(),
          expanded: domainFormContentRootVariants()
        }"
        @update:model-value="onSelect"
      >
        <template #expanded>
          <!-- register -->
          <FormControl
            v-if="meta.showDac && type === 'register'"
            :invalid="false"
            :formItemId="`dac-${type}`"
            key="dac-register"
            :auto-focus="shouldAutoFocus"
          >
            <Input
              size="lg"
              v-model="query"
              :placeholder="t('form.domain_search.placeholder')"
              autocomplete="url"
              :disabled="disabled"
            >
              <template v-if="!meta.showSelected" #leading>
                <Icon icon="search" />
              </template>
            </Input>
          </FormControl>

          <!-- existing -->
          <FormControl
            v-else-if="meta.showExisting"
            :formItemId="`dac-${type}`"
            key="dac-existing"
            :auto-focus="shouldAutoFocus"
          >
            <Input
              size="lg"
              v-model="modelValue"
              autocomplete="url"
              :placeholder="t('form.domain.placeholder')"
              :list="ownedDomains.length ? 'dac-owned-domains' : undefined"
              :disabled="disabled"
            />
            <datalist v-if="ownedDomains.length" id="dac-owned-domains">
              <option
                v-for="owned in ownedDomains"
                :key="owned.domain"
                :value="owned.domain"
              />
            </datalist>
          </FormControl>

          <!-- basket -->
          <FormControl
            v-else-if="meta.showBasket"
            key="basket"
            :auto-focus="shouldAutoFocus"
            :formItemId="`dac-${type}`"
          >
            <Select
              :model-value="selected"
              :items="basketDomains"
              :disabled="disabled || meta.isSearching || meta.isProcessing"
              size="lg"
              class="w-full"
              @update:model-value="onSelectBasket"
            >
              <template #value>
                <span v-if="selectedBasketLabel">{{
                  selectedBasketLabel
                }}</span>
                <span v-else class="text-muted">{{
                  t("form.select_option.placeholder")
                }}</span>
              </template>
            </Select>
          </FormControl>
        </template>
      </RadioGroup>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { RadioGroup, Skeleton, Select, Input } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { FormControl } from "../../../components/form";
import { Icon } from "../../../components/icon";
import {
  domainRootVariants,
  domainFormRootVariants,
  domainFormItemVariants,
  domainFormTriggerRootVariants,
  domainFormTriggerLabelVariants,
  domainFormTriggerRadioVariants,
  domainFormContentRootVariants
} from "../variants";
import { map } from "lodash-es";
import type { UseDomain } from "@upmind-automation/headless";

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

const formMeta = computed(() => ({
  isDisabled: props.disabled || props.processing
}));

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
      value: choice.value,
      label: rt(translations?.label) || choice.label,
      item: choice,
      index,
      modelValue: choice.value
    };
  });
});

const shouldAutoFocus = ref(false);

function onSelect(value: unknown) {
  const match = props.choices?.find(choice => choice.value === value);
  if (!match) return;
  if (match.value !== props.type) {
    shouldAutoFocus.value = true;
  }
  type.value = match.value;
}

const ownedDomains = computed(() => props.owned ?? []);

const basketDomains = computed(() =>
  map(props.basket, (item, index) => ({
    index,
    item,
    value: item.domain?.toString() ?? "",
    label: item.domain
  }))
);

const selectedBasketLabel = computed(() => {
  const match = basketDomains.value.find(
    domain => domain.value === selected.value?.toString()
  );
  return match?.label ?? "";
});

function onSelectBasket(value: unknown) {
  if (props.disabled || !value) return;
  selected.value = String(value);
}
</script>
