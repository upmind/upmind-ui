import type { ResponseError } from "../../utils";
import type { ImageObjectTypes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Interface representing the context for managing file uploads, typically used with an XState machine.
 * This context holds information about the upload field, allowed file types, progress,
 * request/response details, and any errors encountered.
 */
export interface UploadContext {
  /**
   * Details about the file input field, including its type, ID, and default status.
   */
  field: {
    /**
     * The type of the field, usually an {@link ImageObjectTypes} or similar enum indicating the expected file type.
     */
    field_type: ImageObjectTypes;
    /**
     * The unique identifier of the file input field.
     */
    field_id: string;
    /**
     * `true` if this is the default file input field.
     */
    field_is_default: boolean;
  };

  // ---
  /**
   * An array of allowed file types for the upload, specified as MIME types or file extensions (e.g. `['image/png', 'image/jpeg']`).
   */
  fileTypes: string[];

  // ---
  /**
   * The current progress of the file upload, represented as a percentage (0-100).
   */
  progress: number;
  /**
   * The `request` object associated with the file upload, if available.
   */
  request?: any;
  /**
   * The `response` object received after the file upload, if available.
   */
  response?: any;
  /**
   * The file itself, or its name/identifier, if selected or uploaded.
   */
  file?: string | null;
  /**
   * The name of the uploaded file.
   */
  name?: string | null;
  /**
   * The URL of the uploaded file, if available after successful upload.
   */
  src?: string | null;

  // ---
  /**
   * An error object if any issue occurred during the file upload process.
   */
  error?: ResponseError;
}
