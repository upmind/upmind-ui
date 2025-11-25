import { registerEntry } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";
import SLDRenderer, { tester as sldTest } from "./SLDRenderer.vue";
import AddressRenderer, { tester as addressTest } from "./AddressRenderer.vue";
import ImageRenderer, { tester as imageTest } from "./ImageRenderer.vue";
import ManageRenderer, { tester as manageTest } from "./ManageRenderer.vue";
import PaymentDetailsRenderer, {
  tester as paymentMethodTest
} from "./PaymentDetailsRenderer.vue";
import GatewaysRenderer, {
  tester as gatewayMethodTest
} from "./GatewaysRenderer.vue";

// import EnumRadioCollapsibleRenderer, {
//   tester as enumRadioCollapsibleTest
// } from "./EnumRadioCollapsibleRenderer.vue";

// -----------------------------------------------------------------------------

export const formRenderers = [
  // registerEntry(EnumRadioCollapsibleRenderer, enumRadioCollapsibleTest),
  registerEntry(DomainRenderer, domainTest),
  registerEntry(SLDRenderer, sldTest),
  registerEntry(AddressRenderer, addressTest),
  registerEntry(ImageRenderer, imageTest),
  registerEntry(ManageRenderer, manageTest),
  registerEntry(PaymentDetailsRenderer, paymentMethodTest),
  registerEntry(GatewaysRenderer, gatewayMethodTest)
];
