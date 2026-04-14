// --- external

// --- internal

// --- utils

// --- types
import type { PaymentContext } from "../types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

/**
 * Result returned from a challenge renderer.
 */
export interface ChallengeRenderResult {
  /** Cleanup function to remove event listeners, iframes, etc. */
  cleanup?: () => void;
  /** Any additional data to pass to the verify step */
  data?: Record<string, unknown>;
}

/**
 * Renderer function type for challenge rendering.
 * Injects into a provided container element and handles gateway-specific challenge logic.
 */
export type ChallengeRenderer = (
  context: PaymentContext,
  event: AnyEventObject
) => Promise<ChallengeRenderResult>;

/**
 * Configuration for a gateway challenge renderer.
 */
export interface ChallengeRendererConfig {
  /** The render function that injects the challenge UI into the container */
  render: ChallengeRenderer;
  /** Optional: Whether this renderer supports the current payment context */
  isSupported?: (context: PaymentContext) => boolean;
}
