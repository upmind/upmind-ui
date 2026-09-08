// -----------------------------------------------------------------------------
/**
 * @module portal/primitives
 * @description The primitive descriptor table — slot ids and accept lists,
 * transcribed verbatim from design.md §D4. Data the resolver reads; adding a
 * primitive or a slot is a table row here, never a conditional in resolve.ts.
 */

import { ACCEPT_TAG, PRIMITIVE_ID } from "./types";
import type { AcceptTag, PrimitiveId } from "./types";

export type PrimitiveSlotDescriptor = {
  readonly id: string;
  readonly accepts: readonly AcceptTag[];
};

export type PrimitiveDescriptor = {
  readonly id: PrimitiveId;
  readonly slots: readonly PrimitiveSlotDescriptor[];
};

export const PRIMITIVES: Readonly<Record<PrimitiveId, PrimitiveDescriptor>> = {
  [PRIMITIVE_ID.TOPBAR]: {
    id: PRIMITIVE_ID.TOPBAR,
    slots: [
      {
        id: "left",
        accepts: [
          ACCEPT_TAG.IDENTITY,
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "centre",
        accepts: [
          ACCEPT_TAG.IDENTITY,
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "right",
        accepts: [
          ACCEPT_TAG.IDENTITY,
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      }
    ]
  },
  [PRIMITIVE_ID.SECONDARY]: {
    id: PRIMITIVE_ID.SECONDARY,
    slots: [
      {
        id: "left",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "centre",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "right",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      }
    ]
  },
  [PRIMITIVE_ID.TERTIARY]: {
    id: PRIMITIVE_ID.TERTIARY,
    slots: [
      {
        id: "left",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "centre",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "right",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.ACTIONS,
          // The Assets board (NP.3, tertiary.right) seats a metric beside the
          // badge — a content module, on this one slot.
          ACCEPT_TAG.CONTENT
        ]
      }
    ]
  },
  [PRIMITIVE_ID.SIDEBAR]: {
    id: PRIMITIVE_ID.SIDEBAR,
    slots: [
      {
        id: "top",
        accepts: [
          ACCEPT_TAG.IDENTITY,
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "middle",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.ACTIONS
        ]
      },
      {
        id: "bottom",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS
        ]
      }
    ]
  },
  [PRIMITIVE_ID.UTILITY]: {
    id: PRIMITIVE_ID.UTILITY,
    slots: [
      {
        id: "top",
        accepts: [
          // The Rockzone board (NP.5, utility.top) opens the pane with the
          // member's identity — a brand-tagged module.
          ACCEPT_TAG.IDENTITY,
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.UTILITY,
          ACCEPT_TAG.ACTIONS,
          ACCEPT_TAG.CONTENT
        ]
      },
      {
        id: "topmid",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.ACTIONS,
          ACCEPT_TAG.CONTENT
        ]
      },
      {
        id: "botmid",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.ACTIONS,
          ACCEPT_TAG.CONTENT
        ]
      },
      {
        id: "bottom",
        accepts: [
          ACCEPT_TAG.NAV,
          ACCEPT_TAG.SEARCH,
          ACCEPT_TAG.STATUS,
          ACCEPT_TAG.ACTIONS,
          ACCEPT_TAG.CONTENT
        ]
      }
    ]
  },
  [PRIMITIVE_ID.BOTTOM]: {
    id: PRIMITIVE_ID.BOTTOM,
    slots: [{ id: "default", accepts: [ACCEPT_TAG.NAV] }]
  }
};
