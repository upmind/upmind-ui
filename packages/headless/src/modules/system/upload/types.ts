// --- internal
// import type { RequestError } from "../../api/types";
import type {
  ImageObjectTypes,
  ImageUploadTypes,
} from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// interface Dimensions {
//   width: number;
//   height: number;
// }

export interface ImageHashEvent {
  hash: string;
}

export interface ImageTypeEvent {
  field: {
    field_type: ImageObjectTypes;
    field_id: string;
    field_is_default: boolean;
  };
}
// --------------------------------------------------------
// Contexts

export interface UploadContext {
  field: Object;

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
  file?: string | null;
  name?: string | null;
  src?: string | null;

  // ---
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface UploadEvent {
  type: string;
  data: any;
  // error?: RequestError;
  error?: any;
}
