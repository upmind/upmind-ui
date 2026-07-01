// -----------------------------------------------------------------------------
/**
 * @module __tests__/setup.unit
 * @description Vitest setup for the unit project. Unit tests mock their own
 * boundaries (see e.g. query/__tests__/mocks.ts) and never touch the network,
 * so no MSW server is started here. Kept as a deliberate seam for unit-only
 * global setup should it ever be needed.
 */

export {};
