// -----------------------------------------------------------------------------
/**
 * @module payment/renderers
 * @description The two Upmind-domain form renderers this package owns.
 */
import { registerEntry } from "@upmind/ui";
import GatewaysRenderer from "./GatewaysRenderer.vue";
import { tester as gatewaysTester } from "./GatewaysRenderer.vue";
import PaymentDetailsRenderer from "./PaymentDetailsRenderer.vue";
import { tester as paymentDetailsTester } from "./PaymentDetailsRenderer.vue";
import type { FormRendererEntry } from "@upmind-automation/foundation";

export const paymentRenderers: FormRendererEntry[] = [
  registerEntry(PaymentDetailsRenderer, paymentDetailsTester),
  registerEntry(GatewaysRenderer, gatewaysTester)
];
