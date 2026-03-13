// --- external

// --- internal
import type { PaymentContext } from "../types";
import type { ChallengeRenderResult } from "./types";

// --- utils

// --- types
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

/**
 * MercadoPago challenge renderer.
 * Creates an iframe-based challenge form that posts to the external challenge URL
 * and listens for completion messages from the iframe.
 *
 * Based on the legacy MercadopagoSCAChallengeModal component.
 */
export async function render(
  context: PaymentContext,
  event: AnyEventObject
): Promise<ChallengeRenderResult> {
  const { payment } = context;
  const container = event.data?.container as HTMLElement | undefined;

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

  return new Promise((resolve, reject) => {
    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.height = "100%";
    iframe.width = "100%";
    iframe.name = "challengeFrame";
    iframe.className = "h-full w-full border-none";
    iframe.style.minHeight = "400px";
    container.appendChild(iframe);

    // Message handler for challenge completion
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.status === "COMPLETE") {
        cleanup();
        resolve({
          data: {
            redirectUrl,
            status: "COMPLETE"
          },
          cleanup
        });
      }
    };

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    // Add message listener
    window.addEventListener("message", handleMessage);

    // Wait for iframe to be ready, then create and submit the challenge form
    iframe.onload = () => {
      // We only want to handle the initial load, not subsequent loads
      iframe.onload = null;
    };

    // Create form and submit to iframe
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      cleanup();
      reject(new Error("Cannot access iframe document"));
      return;
    }

    // Create the challenge form
    const challengeForm = iframeDoc.createElement("form");
    challengeForm.name = "challengeForm";
    challengeForm.setAttribute("target", "challengeFrame");
    challengeForm.setAttribute("method", "post");
    challengeForm.setAttribute("action", challengeUrl);

    // Add creq hidden field
    const hiddenField = iframeDoc.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "creq");
    hiddenField.setAttribute("value", creq || "");
    challengeForm.appendChild(hiddenField);

    // Append form to iframe body and submit
    iframeDoc.body.appendChild(challengeForm);
    challengeForm.submit();
  });
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
