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
  CLIENT_CUSTOM_FIELD = "client_custom_field"
}

export const ImageUploadTypes = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml"
];
// --------------------------------------------------------
// private

interface Dimensions {
  width: number;
  height: number;
}

export interface ImageHashEvent {
  hash: string;
}

export interface ImageTypeEvent {
  fileType: ImageObjectTypes;
  fileTypeId: string;
  isDefault: boolean;
}
// --------------------------------------------------------
// Contexts

export interface SystemContext {
  currencies: Array<any> | null;
  billingCycles: Array<any> | null;
  // ---
  error?: RequestError;
}

export interface UploadContext {
  fileType?: ImageObjectTypes | null;
  fileTypeId?: string | null;
  isDefault?: boolean;

  // ---
  fileTypes: [];
  // maxFileSize: number;
  // minFileSize: number;
  // minDimensions: Dimensions;
  // maxDimensions: Dimensions;

  // ---
  progress: number;
  request?: Object | null;
  response?: Object | null;
  file?: Object | null;
  src?: string | null;

  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface SystemEvent {
  fileType: string;
  data: any;
  error?: RequestError;
}

export interface UploadEvent {
  fileType: string;
  data: any;
  error?: RequestError;
}

export interface ImageEvent {
  fileType: string;
  data: Object<ImageTypeEvent | ImageHashEvent>;
  error?: RequestError;
}
