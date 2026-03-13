<template>
  <UpmSections
    class="min-h-44"
    v-model="activeTab"
    :sections="sections"
    data-testid="billing"
  >
    <template v-slot:[`section-address`]>
      <UpmManage
        i18n-key="form.address"
        v-model="defaultAddressValue"
        :force-open="true"
        :manage="{
          useList: useClientAddresses,
          useMutate: useClientAddressManager
        }"
      >
        <template #item="{ item, readonly, doEdit, doRemove, setDefault }">
          <AddressItem
            v-bind="item"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
            @setDefault="setDefault"
          />
        </template>
      </UpmManage>
    </template>

    <template v-slot:[`section-business`]>
      <UpmManage
        i18n-key="form.company"
        v-model="defaultCompanyValue"
        :force-open="true"
        :manage="{
          useList: useClientCompanies,
          useMutate: useClientCompanyManager
        }"
      >
        <template #item="{ item, readonly, doEdit, doRemove, setDefault }">
          <CompanyItem
            v-bind="item"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
            @setDefault="setDefault"
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

// --- internal
import {
  useClientAddresses,
  useClientAddressManager,
  useClientCompanies,
  useClientCompanyManager,
  useSession
} from "@upmind-automation/headless";
import type { TabItem } from "@upmind-automation/upmind-ui";

// --- components
import { UpmManage, UpmSections } from "@upmind-automation/client-vue";
import AddressItem from "./AddressItem.vue";
import CompanyItem from "./CompanyItem.vue";
import { sortBy } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    skipAuth?: boolean;
  }>(),
  {
    skipAuth: false
  }
);

const { t } = useI18n();

const { isAuthenticated } = useSession();
if (!props.skipAuth) {
  await isAuthenticated();
}

const {
  isReady: isCompaniesReady,
  default: defaultCompany,
  meta: companiesMeta
} = useClientCompanies();

const { isReady: isAddressesReady, default: defaultAddress } =
  useClientAddresses();

await Promise.all([isAddressesReady(), isCompaniesReady()]);

const defaultAddressValue = ref(defaultAddress()?.id);
const defaultCompanyValue = ref(defaultCompany()?.id);

const sections = computed<TabItem[]>(() => {
  const tabs = [
    {
      label: t("text.companies"),
      value: "business"
    },
    {
      label: t("text.personal"),
      value: "address"
    }
  ];

  // Sort so that "company" comes first if we have companies
  return sortBy(tabs, tab => {
    if (companiesMeta.value.isEmpty) {
      return tab.value === "address" ? 0 : 1;
    }
    return tab.label;
  });
});

const activeTab = ref(companiesMeta.value.isEmpty ? "address" : "business");
</script>
