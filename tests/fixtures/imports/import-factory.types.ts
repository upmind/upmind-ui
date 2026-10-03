// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/imports/import-factory.types
 * @description Types for the staging import factory (design §5.2).
 */

// -----------------------------------------------------------------------------

export type TemplateType =
  | "clients"
  | "users"
  | "products"
  | "contracts"
  | "invoices"
  | "client-payment-details";

export type RecordSpec = {
  id?: string;
} & Record<string, string | number | boolean | undefined>;

export type ImportStatement = {
  name?: string;
  staged?: boolean;
  brandId?: string;
  clients?: RecordSpec[];
  users?: RecordSpec[];
  products?: RecordSpec[];
  contracts?: RecordSpec[];
  invoices?: RecordSpec[];
  clientPaymentDetails?: RecordSpec[];
};

export type ImportRow = {
  localId: string;
  values: Record<string, string>;
};

export type ImportFile = {
  type: TemplateType;
  stepCode: string;
  header: string;
  rows: ImportRow[];
  csv: string;
  localIds: string[];
};

export type ImportSet = {
  name: string;
  staged: boolean;
  brandId?: string;
  files: ImportFile[];
};

export type ImportHandle = {
  importId: string;
  name: string;
  brandId: string;
  staged: boolean;
  localIds: { type: TemplateType; ids: string[] }[];
};

export type StagingConfig = {
  apiUrl: string;
  origin: string;
  token: string;
};
