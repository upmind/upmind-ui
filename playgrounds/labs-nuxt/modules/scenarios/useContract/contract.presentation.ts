// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContract/contract.presentation
 * @description How one contract DRAWS as a record on the shared record
 * surface: its title (the manager's own `title` sibling), its status, the
 * shared contract summary (`contract.summary.ts`), one section per product
 * drawn through the shared product summary (`contract-product.summary.ts`)
 * with a link to that product's own record, the payment-method write and the
 * footer utilities.
 *
 * Change payment method opens the manager's own `paymentMethod` context slot,
 * which `openPaymentMethod` fills with the client's stored cards; a contract
 * held for fraud offers no such write.
 */

import { ScopeActorTypes, useContracts } from "@upmind-automation/headless";
import { RecordActionPlacementTypes } from "../runtime/scenario.types";
import { contractProductSummary } from "../useContractProduct/contract-product.summary";
import { contractSummary } from "./contract.summary";
import type { RecordUischema } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** The contract, drawn whole as one record. */
export const contractRecord: RecordUischema = {
  type: "RecordLayout",
  record: "contract",
  siblings: ["title"],
  header: {
    title: "#/properties/title",
    status: "#/properties/status/properties/name",
    badges: [{ flag: "isFraud", i18n: "labs.contract_meta_fraud" }]
  },
  sections: [
    {
      kind: "fields",
      key: "details",
      i18n: "labs.record_details",
      icon: "receipt",
      elements: contractSummary({
        base: "#/properties/raw/properties",
        billingCycle: "#/properties/billingCycleLabel"
      })
    },
    {
      kind: "collection",
      key: "products",
      // Each product reads the contract-product record's own Details fields,
      // so the two cannot drift. The mapped products carry only id and name
      // until headless maps them through `mapContractProduct`; the label
      // falls back to `name` meanwhile.
      scope: "#/properties/products",
      rowTitle: ["#/properties/title", "#/properties/name"],
      rowIcon: "layers-three-01",
      row: contractProductSummary,
      rowActions: [
        {
          name: "open",
          i18n: "labs.contract_product_open",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          navigate: {
            route: "/useContractProduct/:id",
            idScope: "#/properties/id"
          }
        }
      ]
    }
  ],
  actions: [
    {
      name: "payment-method",
      i18n: "labs.contract_payment_method_open",
      icon: "credit-card-01",
      gate: "!isFraud",
      run: "openPaymentMethod",
      form: {
        context: "paymentMethod",
        set: "input",
        submit: "update",
        cancel: "clear",
        valid: "isValid",
        i18n: "labs.contract_payment_method",
        submitI18n: "labs.contract_payment_method_submit"
      }
    },
    {
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "refresh"
    },
    {
      name: "reset",
      i18n: "labs.contract_reset",
      icon: "flip-backward",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "reset"
    }
  ],
  picker: {
    use: useContracts,
    actor: ScopeActorTypes.SELF,
    schema: "schemas.contractPicker",
    field: "contract",
    icon: "receipt",
    i18n: {
      title: "labs.contract_needs_id",
      text: "labs.contract_needs_id_text",
      input: "labs.contract_id_label",
      open: "labs.contract_open"
    }
  }
};
