// --- internal
import type { RequestError } from "../../api/types";

// --------------------------------------------------------
// ENUMS

export enum ImageObjectTypes {
  PRODUCT = "product",
  PRODUCT_CATEGORY = "product_category",
  USER = "user",
  BRAND = "brand",
  BRAND_FAVICON = "favicon",
  BRAND_EMAIL_LOGO = "brandEmailLogo",
  CLIENT = "client",
  ORGANIZATION = "organisation",
  CLIENT_CUSTOM_FIELD = "client_custom_field",
}

export const ImageUploadTypes = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
];
// --------------------------------------------------------
// private

// interface Dimensions {
//   width: number;
//   height: number;
// }

export interface ImageHashEvent {
  hash: string;
}

// --------------------------------------------------------
// Contexts

export interface UploadContext {
  field: {
    field_type: ImageObjectTypes;
    field_id: string;
    field_is_default: boolean;
  };

  // ---
  fileTypes: [];
  // maxFileSize: number;
  // minFileSize: number;
  // minDimensions: Dimensions;
  // maxDimensions: Dimensions;

  // ---
  progress: number;
  request?: object | null;
  response?: object | null;
  file?: string | null;
  name?: string | null;
  src?: string | null;

  // ---
  // error?: RequestError;
  error?: any;
}
