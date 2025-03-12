// --- internal
import type { ImageObjectTypes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

// interface Dimensions {
//   width: number;
//   height: number;
// }

// ---  Contexts

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
