// --- internal
import type { RequestError } from "../../api/types";
import { ImageObjectTypes, ImageUploadTypes } from "@upmind-automation/types";

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
  fileTypes: string[];
  // maxFileSize: number;
  // minFileSize: number;
  // minDimensions: Dimensions;
  // maxDimensions: Dimensions;

  // ---
  progress: number;
  request?: any;
  response?: any;
  file?: string | null;
  name?: string | null;
  src?: string | null;

  // ---
  // error?: RequestError;
  error?: any;
}
