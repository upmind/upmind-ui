// --- external

// --- internal
import { useApi } from "../api";

// --- utils

import {} from "lodash-es";

// --- types
import type {
  RecommendationsEngineContext,
  RecommendationsEngineEvents,
} from "./types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function load(
  _context: RecommendationsEngineContext,
  _event: RecommendationsEngineEvents
) {}

// ---

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  refresh: load, // alias
  // ---
};
