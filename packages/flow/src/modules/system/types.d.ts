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
  typeId: string;
  imageType: ImageObjectTypes;
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
  fieldName: string | null;

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
  hash?: string | null;

  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface SystemEvent {
  type: string;
  data: any;
  error?: RequestError;
}

export interface UploadEvent {
  type: string;
  data: any;
  error?: RequestError;
}

export interface ImageEvent {
  type: string;
  data: Object<ImageTypeEvent | ImageHashEvent>;
  error?: RequestError;
}
