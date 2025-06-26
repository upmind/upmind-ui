<template>
  <Loading :active="meta.isLoading" class="w-full">
    <List
      i18nKey="client.address"
      :useList="useClientCompanies"
      v-model="selectedCompany"
      :readonly="props.readonly"
      @add="doAdd(EditingType.Company)"
      @edit="doEdit($event, EditingType.Company)"
    >
      <template #item="{ item }">
        <CompanyItem
          v-bind="item"
          :readonly="props.readonly"
          @edit="doEdit(item.id, EditingType.Company)"
        />
      </template>
    </List>

    <List
      i18nKey="client.phone"
      :useList="useClientPhones"
      v-model="selectedPhone"
      :readonly="props.readonly"
      @add="doAdd(EditingType.Phone)"
      @edit="doEdit($event, EditingType.Phone)"
      minimal
    >
      <template #item="{ item }">
        <PhoneItem
          v-bind="item"
          :readonly="props.readonly"
          @edit="doEdit(item.id, EditingType.Phone)"
        />
      </template>
    </List>

    <Form
      v-if="openForm && editing && useMutate"
      :key="editing"
      :i18nKey="i18nKey"
      :useMutate="useMutate"
      :open="openForm"
      :model-value="editId"
      :modal="modal"
      @resolve="doResolve"
      @reject="doReset"
    />
  </Loading>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import {
  useClientCompanies,
  useClientCompany,
  useClientPhones,
  useClientPhone,
  useUnifiedAddress,
  UnifiedAddressType,
} from "@upmind-automation/headless";

// --- components
import List from "../../components/manage/List.vue";
import Form from "../../components/manage/Form.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils
import { find, isString, set } from "lodash-es";

// --- types

import type { BillingModel } from "@upmind-automation/headless";
import type { MinimalMutateComposable } from "../../components/manage/types";
import CompanyItem from "./components/CompanyItem.vue";
import PhoneItem from "./components/PhoneItem.vue";

enum EditingType {
  Company = "company",
  Phone = "phone",
  Unified = "unified",
}
// -----------------------------------------------------------------------------

const props = defineProps<{
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const { t } = useI18n();

// -----------------------------------------------------------------------------

const {
  data: companies,
  meta: companyMeta,
  default: defaultCompany,
  isReady: isCompaniesReady,
} = useClientCompanies();

const {
  data: phones,
  meta: phoneMeta,
  default: defaultPhone,
  isReady: isPhonesReady,
} = useClientPhones();

const meta = computed(() => ({
  isEmpty: companyMeta.value.isEmpty || phoneMeta.value.isEmpty,
  isLoading: companyMeta.value.isLoading || phoneMeta.value.isLoading,
}));

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  deep: true,
  defaultValue: {
    companyId: defaultCompany.value?.id,
    addressId: defaultCompany.value?.addressId,
    phoneId: defaultPhone.value?.id,
  },
});

// -----------------------------------------------------------------------------
// const open = ref(false);
const openForm = ref(meta.value.isEmpty);
const editing = ref<EditingType | undefined>();
const editId = ref<string | undefined>();

// --- context

const selectedCompany = computed<string | undefined>({
  get() {
    return modelValue.value?.companyId ?? undefined;
  },
  set(val: string | undefined) {
    modelValue.value ??= {};
    const found = find(companies.value, { id: val });
    if (found) {
      set(modelValue.value, "companyId", found.id);
      set(modelValue.value, "addressId", found.addressId);
    }
  },
});

const selectedPhone = computed({
  get() {
    return modelValue.value?.phoneId ?? undefined;
  },
  set(val: string | undefined) {
    modelValue.value ??= {};
    const found = find(phones.value, { id: val });
    if (found) {
      set(modelValue.value, "phoneId", found.id);
    }
  },
});

const i18nKey = computed(() => {
  if (editing.value === EditingType.Unified) return "client.company";
  return `client.${editing.value}`;
});

const useMutate = computed((): MinimalMutateComposable => {
  if (editing.value === EditingType.Company) return useClientCompany;
  if (editing.value === EditingType.Phone) return useClientPhone;
  if (editing.value === EditingType.Unified) return useUnifiedAddress;

  throw new Error(`Unknown editing type: ${editing.value}`);
});

const modal = computed<boolean>(() => {
  switch (editing.value) {
    case EditingType.Company:
      return !!editId.value;

    case EditingType.Phone:
      return !!editId.value;

    case EditingType.Unified:
      return false;

    default:
      return true;
  }
});

// --- methods

function doAdd(type: EditingType) {
  editing.value = type;
  editId.value =
    type == EditingType.Unified ? UnifiedAddressType.BUSINESS : undefined;
  openForm.value = true;
}

function doEdit(id: string, type: EditingType) {
  editing.value = type;
  openForm.value = true;
  editId.value = id;
}

function doReset() {
  if (!modelValue.value?.companyId) {
    debugger;
    doAdd(EditingType.Unified);
  } else if (!modelValue.value?.phoneId) {
    debugger;
    doAdd(EditingType.Phone);
  } else {
    openForm.value = false;
    editId.value = undefined;
    editing.value = undefined;
  }
}

function doResolve(value: BillingModel | string) {
  switch (editing.value) {
    case EditingType.Company:
      selectedCompany.value = isString(value)
        ? value
        : (value?.companyId ?? defaultCompany.value?.id ?? undefined);
      break;

    case EditingType.Phone:
      selectedPhone.value = isString(value)
        ? value
        : (value?.phoneId ?? defaultPhone.value?.id ?? undefined);
      break;

    case EditingType.Unified:
      selectedPhone.value = isString(value)
        ? value
        : (value?.phoneId ?? defaultPhone.value?.id ?? undefined);

      selectedCompany.value = isString(value)
        ? value
        : (value?.companyId ?? defaultCompany.value?.id ?? undefined);
      break;
    default:
      throw new Error(`Unknown editing type: ${editing.value}`);
  }

  // reset our state
  doReset();
}

// --- side effects

await Promise.all([isCompaniesReady(), isPhonesReady()]).then(() => {
  // Ensure modelValue is initialized with default values
  modelValue.value = {
    companyId: modelValue.value?.companyId ?? defaultCompany.value?.id,
    addressId: modelValue.value?.addressId ?? defaultCompany.value?.addressId,
    phoneId: modelValue.value?.phoneId ?? defaultPhone.value?.id,
  };

  if (!modelValue.value.companyId) {
    doAdd(EditingType.Unified);
  }
  if (!modelValue.value.phoneId) {
    doAdd(EditingType.Phone);
  }
});
</script>
