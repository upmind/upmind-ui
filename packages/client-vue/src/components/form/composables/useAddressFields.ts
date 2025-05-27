import { ref } from "vue";
import type { Address } from "@upmind-automation/headless-vue";

const showAddressFields = ref<boolean>(true);
const selectedAddress = ref<Address | null>(null);

export const useAddressFields = () => {
  const setShowAddressFields = (value: boolean) => {
    showAddressFields.value = value;
  };

  const setSelectedAddress = (address: Address) => {
    selectedAddress.value = address;
  };

  return {
    showAddressFields,
    setShowAddressFields,
    selectedAddress,
    setSelectedAddress,
  };
};
