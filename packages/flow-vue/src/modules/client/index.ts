// --- exports
export * from "./address";
export * from "./company";
export * from "./email";
export * from "./phone";

// --- external
import { computed } from "vue";

// --- internal
import { useClientAddresses, useClientAddress } from "./address";
import { useClientCompanies, useClientCompany } from "./company";

// --- utils
import { every, some } from "lodash-es";

// -----------------------------------------------------------------------------
export const useClient = () => {
  const addresses = useClientAddresses();
  const companies = useClientCompanies();

  const services = [addresses, companies];
  // --------------------------------------------------------

  return {
    addresses,
    companies,
    address: useClientAddress,
    company: useClientCompany,
    // ---
    meta: computed(() => ({
      isAvailable: every(services, "meta.value.isAvailable"),
      isLoading: some(services, "meta.value.isLoading"),
      isAdding: some(services, "meta.value.isAdding"),
      isEditing: some(services, "meta.value.isEditing"),
      isEmpty: every(services, "meta.value.isEmpty"),
    })),
    // ---
    getSelected: async () => await addresses.getSelected(),
    selected: computed(
      () => addresses.selected.value || addresses.default.value
      //||  companies.selected.value
      //||  companies.default.value
    ),
    // ---
    isReady: async () => Promise.all([addresses.isReady, companies.isReady]),
    // edit: id => send({ type: "EDIT", data: id }),
    add: addresses.add,
  };
};
