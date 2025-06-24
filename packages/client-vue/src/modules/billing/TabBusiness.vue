<template>
  <div>
    <pre>{{ { selected, open, modelValue } }}</pre>

    <!-- address vs company -->
    <RadioCardsCollapsible
      v-if="!meta.isLoading && !meta.isEmpty"
      v-model:open="open"
      v-model="selected"
      :items="parsedValues"
      :list="false"
      required
    >
      <template #item="{ item }">
        <CompanyItem v-bind="item" :readonly="props.readonly" />
      </template>

      <template #actions>
        <Link
          v-if="!open && parsedValues.length > 1"
          :label="t('billing.actions.change')"
          size="xs"
          variant="muted"
          @click="open = true"
        />

        <Link
          v-else-if="!readonly"
          :label="
            t('billing.actions.add', { type: UnifiedAddressType.BUSINESS })
          "
          size="xs"
          variant="muted"
          @click="openModel = true"
        />
      </template>
    </RadioCardsCollapsible>

    <Add
      v-if="(!meta.isLoading && meta.isEmpty) || openModel"
      v-model:open="openModel"
      :client-id="props.clientId"
      :modal="!meta.isEmpty"
      :type="UnifiedAddressType.BUSINESS"
      @resolve="doResolve"
      @reject="doReject"
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientCompanies,
  UnifiedAddressType,
} from "@upmind-automation/headless";

// --- components
import { RadioCardsCollapsible, Link } from "@upmind-automation/upmind-ui";
import Add from "./Add.vue";
import CompanyItem from "../client/company/Item.vue";

// --- utils
import { map, set, find } from "lodash-es";

// --- types

import type { BillingModel, Company } from "@upmind-automation/headless";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  clientId: string;
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const { data, meta, default: defaultItem } = useClientCompanies();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
});

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(meta.value.isEmpty);
const editId = ref<string>("");

const selected = computed({
  get() {
    return modelValue.value?.companyId || defaultItem.value?.id;
  },
  set(val: string) {
    const company = find(data.value, ["id", val]) as Company;
    modelValue.value = {
      companyId: company.id,
      addressId: company.addressId,
      phoneId: company.phoneId,
    };
  },
});

const parsedValues = computed(() => {
  return map(data.value || [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index,
    };
  }) as RadioCardsItemProps[];
});

function doReject() {
  openModel.value = false;
  editId.value = "";
}

function doResolve(value: BillingModel) {
  modelValue.value = value;
  openModel.value = false;
  editId.value = "";
}
</script>
