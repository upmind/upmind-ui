import { defineAsyncComponent } from "vue";
import { registerEntry } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
const DomainRenderer = defineAsyncComponent(
  () => import("./DomainRenderer.vue")
);
const SLDRenderer = defineAsyncComponent(() => import("./SLDRenderer.vue"));
const AddressRenderer = defineAsyncComponent(
  () => import("./AddressRenderer.vue")
);
const ImageRenderer = defineAsyncComponent(() => import("./ImageRenderer.vue"));
const ManageRenderer = defineAsyncComponent(
  () => import("./ManageRenderer.vue")
);
const PaymentDetailsRenderer = defineAsyncComponent(
  () => import("./PaymentDetailsRenderer.vue")
);
const GatewaysRenderer = defineAsyncComponent(
  () => import("./GatewaysRenderer.vue")
);

// -----------------------------------------------------------------------------
import { tester as domainTest } from "./DomainRenderer.vue";
import { tester as sldTest } from "./SLDRenderer.vue";
import { tester as addressTest } from "./AddressRenderer.vue";
import { tester as imageTest } from "./ImageRenderer.vue";
import { tester as manageTest } from "./ManageRenderer.vue";
import { tester as paymentMethodTest } from "./PaymentDetailsRenderer.vue";
import { tester as gatewayMethodTest } from "./GatewaysRenderer.vue";

// -----------------------------------------------------------------------------

export const formRenderers = [
  registerEntry(DomainRenderer, domainTest),
  registerEntry(SLDRenderer, sldTest),
  registerEntry(AddressRenderer, addressTest),
  registerEntry(ImageRenderer, imageTest),
  registerEntry(ManageRenderer, manageTest),
  registerEntry(PaymentDetailsRenderer, paymentMethodTest),
  registerEntry(GatewaysRenderer, gatewayMethodTest)
];
