// Pulls Vite's ambient client types (import.meta.env / import.meta.glob) into
// the journeys typecheck program — headless source reads them, and the restricted
// `types` array (needed for typeRoots) can't name a non-@types package.
/// <reference types="vite/client" />
