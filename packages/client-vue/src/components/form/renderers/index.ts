import { registerEntry } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";
import SLDRenderer, { tester as sldTest } from "./SLDRenderer.vue";
import AddressRenderer, { tester as addressTest } from "./AddressRenderer.vue";
import BillingRenderer, { tester as billingTest } from "./BillingRenderer.vue";
import ImageRenderer, { tester as imageTest } from "./ImageRenderer.vue";
import ModelListRenderer, {
  tester as modelListTest,
} from "./ModelRenderer/ModelListRenderer.vue";

// -----------------------------------------------------------------------------

export const formRenderers = [
  registerEntry(DomainRenderer, domainTest),
  registerEntry(SLDRenderer, sldTest),
  registerEntry(AddressRenderer, addressTest),
  registerEntry(ImageRenderer, imageTest),
  registerEntry(BillingRenderer, billingTest),
  registerEntry(ModelListRenderer, modelListTest),
];
