import { registerEntry } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
import DomainRenderer from "./DomainRenderer.vue";
import SLDRenderer from "./SLDRenderer.vue";
import AddressRenderer from "./AddressRenderer.vue";
import ImageRenderer from "./ImageRenderer.vue";
import ManageRenderer from "./ManageRenderer.vue";
import PaymentDetailsRenderer from "./PaymentDetailsRenderer.vue";
import GatewaysRenderer from "./GatewaysRenderer.vue";
import TermsRenderer from "./TermsRenderer.vue";
import SubProductRenderer from "./SubProductRenderer.vue";

// -----------------------------------------------------------------------------
import { tester as domainTest } from "./DomainRenderer.vue";
import { tester as sldTest } from "./SLDRenderer.vue";
import { tester as addressTest } from "./AddressRenderer.vue";
import { tester as imageTest } from "./ImageRenderer.vue";
import { tester as manageTest } from "./ManageRenderer.vue";
import { tester as paymentMethodTest } from "./PaymentDetailsRenderer.vue";
import { tester as gatewayMethodTest } from "./GatewaysRenderer.vue";
import { tester as termsTest } from "./TermsRenderer.vue";
import { tester as subProductTest } from "./SubProductRenderer.vue";

// -----------------------------------------------------------------------------

export const formRenderers = [
  registerEntry(DomainRenderer, domainTest),
  registerEntry(SLDRenderer, sldTest),
  registerEntry(AddressRenderer, addressTest),
  registerEntry(ImageRenderer, imageTest),
  registerEntry(ManageRenderer, manageTest),
  registerEntry(PaymentDetailsRenderer, paymentMethodTest),
  registerEntry(GatewaysRenderer, gatewayMethodTest),
  registerEntry(TermsRenderer, termsTest),
  registerEntry(SubProductRenderer, subProductTest)
];
