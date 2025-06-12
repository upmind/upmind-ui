// --- internal
import { useQuery } from "../..";
import { useBrand } from "../../brand";

// --- utils
import { useTime } from "../../../utils";
import { compact, includes, isEmpty, get } from "lodash-es";

// --- types
import type { UploadContext } from "./types";
import {
  ImageObjectTypes,
  ImageUploadTypes,
  BrandConfigKeys,
  IImage,
} from "@upmind-automation/types";
import { AnyEventObject } from "xstate";

// ---  HELPERS

const fieldPath = (field: any) => {
  let path;

  switch (field.field_type) {
    case ImageObjectTypes.CLIENT:
      path = `clients/${field.field_id}/images`;
      break;
    case ImageObjectTypes.USER:
      path = `users/${field.field_id}/images`;
      break;
    case ImageObjectTypes.PRODUCT:
      path = `products/${field.field_id}/images`;
      break;
    case ImageObjectTypes.PRODUCT_CATEGORY:
      path = `products_categories/${field.field_id}/images`;
      break;
    case ImageObjectTypes.BRAND:
      path = `brands/${field.field_id}/images`;
      break;
    case ImageObjectTypes.BRAND_FAVICON:
      path = `brands/${field.field_id}/images/favicon`;
      break;
    case ImageObjectTypes.BRAND_EMAIL_LOGO:
      path = `brands/${field.field_id}/images/email_logo`;
      break;
    case ImageObjectTypes.CLIENT_CUSTOM_FIELD:
      path = field.field_id
        ? `clients/fields/${field.field_id}/image`
        : `clients/fields/images`;
      break;
    default:
      path = "images";
      break;
  }
  const append = field.field_is_default ? "default" : "";
  return compact([path, append]).join("/");
};

// ---  SERVICE METHODS
// Invoked by machines, providing context and event data

async function getImage({ field }: UploadContext, { data }: AnyEventObject) {
  // if we have a hash, we can skip the request
  if (data?.hash) {
    return Promise.resolve({ ...field, value: data.hash });
  }

  if (!field?.field_type && !data.hash)
    return Promise.reject(new Error("No field type or hash provided"));

  const { get, useUrl } = useQuery();

  // const path = `${fieldPath({ field_type: field.field_type })}/${data.hash}`;
  const path = `images/${data.hash}`;

  return get<IImage>({
    url: useUrl(path),
    queryKey: ["images", data.hash],
    staleTime: useTime()?.DAY,
    withAccessToken: true,
  });
}

async function check(_context: UploadContext, { data }: AnyEventObject) {
  let isValid = true;
  let error: any = null;

  const { ensureConfig } = useBrand();

  const fileTypes = await ensureConfig(
    BrandConfigKeys.ALLOWED_UPLOAD_FILE_TYPES
  ).then(response => {
    const types =
      get(response, BrandConfigKeys.ALLOWED_UPLOAD_FILE_TYPES) ||
      ImageUploadTypes;
    return types;
  });

  if (!isEmpty(fileTypes) && !includes(fileTypes, data.type)) {
    isValid = false;
    error = "Invalid file fileType";
  }

  // if (file.size > 1000000) {
  //   isValid = false;
  //   message = "File size is too big";
  // }

  // if (file.size < 100000) {
  //   isValid = false;
  //   message = "File size is too small";
  // }

  // if (file.width < 100 || file.height < 100) {
  //   isValid = false;
  //   message = "Image dimensions are too small";
  // }

  // if (file.width > 1000 || file.height > 1000) {
  //   isValid = false;
  //   message = "Image dimensions are too big";
  // }

  return new Promise((resolve, reject) => {
    if (isValid) {
      resolve(data);
    } else {
      reject(error);
    }
  });
}

async function upload(
  { field, request }: UploadContext,
  _event: AnyEventObject
) {
  const { post, useUrl } = useQuery();
  const path = fieldPath(field);
  return post({
    url: useUrl(path),
    data: request,
    withAccessToken: true,
  });
}

// -----------------------------------------------------------------------------

export default {
  getImage,
  check,
  upload,
};
