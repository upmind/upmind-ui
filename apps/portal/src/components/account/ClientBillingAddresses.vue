<template>
  <UpmSections
    class="min-h-52"
    v-model="activeTab"
    :sections="sections"
    data-testid="billing"
  >
    <template v-slot:[`section-address`]>
      <UpmManage
        i18n-key="form.address"
        v-model="defaultAddressValue"
        :manage="{
          useList: useClientAddresses,
          useMutate: useClientAddress
        }"
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <AddressItem
            v-bind="item"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
          />
        </template>
      </UpmManage>
    </template>

    <template v-slot:[`section-business`]>
      <UpmManage
        i18n-key="form.company"
        v-model="defaultCompanyValue"
        :manage="{
          useList: useClientCompanies,
          useMutate: useClientCompany
        }"
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <CompanyItem
            v-bind="item"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
          />
        </template>
      </UpmManage>
    </template>
  </UpmSections>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { concat } from "lodash-es";

// --- internal
import {
  // useSession,
  useClientAddresses,
  useClientAddress,
  useClientCompanies,
  useClientCompany
} from "@upmind-automation/headless";
import type { TabItem } from "@upmind-automation/upmind-ui";

// --- components
import {
  UpmManage,
  // UpmSection,
  UpmSections
} from "@upmind-automation/client-vue";
import AddressItem from "./AddressItem.vue";
import CompanyItem from "./CompanyItem.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
// const { meta } = useSession();

const {
  isReady: getAddresses,
  default: defaultAddress,
  meta: addressesMeta,
  data: addresses
} = useClientAddresses();

const {
  isReady: getCompanies,
  default: defaultCompany,
  meta: companiesMeta,
  data: companies
} = useClientCompanies();

await Promise.all([getAddresses(), getCompanies()]);

const defaultAddressValue = defaultAddress()?.id;
const defaultCompanyValue = defaultCompany()?.id;

const sections = computed<TabItem[]>(() => {
  const companiesTab = {
    label: t("text.companies"),
    value: "business"
  };

  return concat(
    ...(companiesMeta.value.isEmpty ? [] : [companiesTab]),
    [
      {
        label: t("text.personal"),
        value: "address"
      }
    ],
    ...(companiesMeta.value.isEmpty ? [companiesTab] : [])
  );
});

const activeTab = ref(companiesMeta.value.isEmpty ? "address" : "business");
</script>
