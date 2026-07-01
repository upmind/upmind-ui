import type { PaymentContext } from "../payment.types";
import type { ChallengeRenderResult } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

/**
 * MercadoPago challenge renderer.
 * Creates an iframe-based challenge form that posts to the external challenge URL.
 * Resolves immediately once the iframe is mounted and the form is submitted.
 * Challenge completion is communicated via the `onComplete` callback from the event.
 *
 * Based on the legacy MercadopagoSCAChallengeModal component.
 */
export async function render(
  context: PaymentContext,
  event: AnyEventObject
): Promise<ChallengeRenderResult> {
  const { payment } = context;
  const container = event.data?.container as HTMLElement | undefined;
  const onComplete = event.data?.onComplete as
    | ((data?: Record<string, unknown>) => void)
    | undefined;

  if (!container) {
    throw new Error("Container element is required for MercadoPago challenge");
  }

  const approval_url = payment?.approval_url;
  if (!approval_url) {
    throw new Error("Approval URL is required for MercadoPago challenge");
  }

  const challengeUrl = approval_url.fields?.external_resource_url as string;
  const redirectUrl = approval_url.fields
    ?.redirect_url_after_challenge as string;
  const creq = approval_url.fields?.creq as string;

  if (!challengeUrl) {
    throw new Error("Challenge URL (external_resource_url) is required");
  }

  // --- Create iframe
  const iframe = document.createElement("iframe");
  iframe.height = "100%";
  iframe.width = "100%";
  iframe.name = "challengeFrame";
  iframe.className = "h-full w-full border-none";
  iframe.style.minHeight = "400px";
  container.appendChild(iframe);

  // --- Cleanup function
  let completed = false;
  const cleanup = () => {
    window.removeEventListener("message", handleMessage);
    iframe.onload = null;
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  // --- Challenge completion handler
  const complete = () => {
    if (completed) return;
    completed = true;
    cleanup();
    onComplete?.({ redirectUrl, status: "COMPLETE" });
  };

  // --- Message handler for challenge completion (postMessage from iframe)
  const handleMessage = (e: MessageEvent) => {
    if (e.data?.status === "COMPLETE") {
      complete();
    }
  };

  window.addEventListener("message", handleMessage);

  // --- Track iframe loads — first load is the challenge page,
  // subsequent loads indicate the challenge completed (redirect)
  let loadCount = 0;
  iframe.onload = () => {
    loadCount++;
    if (loadCount > 1) {
      complete();
    }
  };

  // --- Create form and submit to iframe
  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    cleanup();
    throw new Error("Cannot access iframe document");
  }

  const challengeForm = iframeDoc.createElement("form");
  challengeForm.name = "challengeForm";
  challengeForm.setAttribute("target", "challengeFrame");
  challengeForm.setAttribute("method", "post");
  challengeForm.setAttribute("action", challengeUrl);

  const hiddenField = iframeDoc.createElement("input");
  hiddenField.setAttribute("type", "hidden");
  hiddenField.setAttribute("name", "creq");
  hiddenField.setAttribute("value", creq || "");
  challengeForm.appendChild(hiddenField);

  iframeDoc.body.appendChild(challengeForm);
  challengeForm.submit();

  // --- Resolve immediately — the iframe is mounted and form submitted.
  // Challenge completion will be communicated via onComplete callback.
  return {
    data: { redirectUrl, status: "MOUNTED" },
    cleanup
  };
}

/**
 * Check if this renderer supports the given payment context.
 * MercadoPago challenge is supported when we have the required fields.
 */
export function isSupported(context: PaymentContext): boolean {
  const { payment } = context;
  const approval_url = payment?.approval_url;

  return !!(
    approval_url?.fields?.external_resource_url &&
    approval_url?.fields?.redirect_url_after_challenge
  );
}

// -----------------------------------------------------------------------------

export default {
  render,
  isSupported
};
