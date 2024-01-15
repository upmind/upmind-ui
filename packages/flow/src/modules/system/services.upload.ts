// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";

// --- utils
import { compact, includes, isEmpty, get } from "lodash-es";

// --- types
import type { ImageEvent } from "./types.d";
import { ImageObjectTypes, ImageUploadTypes } from "./types.d";

// --------------------------------------------------------
// HELPERS

const filePath = (
  fileType?: ImageObjectTypes,
  fileTypeId?: string,
  isDefault?: boolean
) => {
  let path;

  switch (fileType) {
    case ImageObjectTypes.CLIENT:
      path = `clients/${fileTypeId}/images`;
      break;
    case ImageObjectTypes.USER:
      path = `users/${fileTypeId}/images`;
      break;
    case ImageObjectTypes.PRODUCT:
      path = `products/${fileTypeId}/images`;
      break;
    case ImageObjectTypes.PRODUCT_CATEGORY:
      path = `products_categories/${fileTypeId}/images`;
      break;
    case ImageObjectTypes.BRAND:
      path = `brands/${fileTypeId}/images`;
      break;
    case ImageObjectTypes.BRAND_FAVICON:
      path = `brands/${fileTypeId}/images/favicon`;
      break;
    case ImageObjectTypes.BRAND_EMAIL_LOGO:
      path = `brands/${fileTypeId}/images/email_logo`;
      break;
    case ImageObjectTypes.CLIENT_CUSTOM_FIELD:
      path = fileTypeId
        ? `clients/fields/${fileTypeId}/image`
        : `clients/fields/images`;
      break;
    default:
      path = "images";
      break;
  }
  const append = isDefault ? "default" : "";
  return compact([path, append]).join("/");
};

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function getImage(
  { fileType, fileTypeId, isDefault }: any,
  { data }: ImageEvent
) {
  // if we have a hash, we can skip the request
  if (data?.hash) {
    return Promise.resolve({ value: data.hash });
  }

  if (!fileTypeId) return Promise.reject("No file type or hash provided");

  const { get, useUrl, useTime } = useApi();

  const path = filePath(fileType, fileTypeId, isDefault);

  return get({
    url: useUrl(path, {
      // with_staged_imports: 1
      // ...data.params
    }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function check(_context: any, { data }: any) {
  let isValid = true;
  let error = null;

  const { getConfig } = useBrand();
  const fileTypes = await getConfig(
    BrandConfigKeys.ALLOWED_UPLOAD_FILE_TYPES
  ).then(
    response =>
      get(response, BrandConfigKeys.ALLOWED_UPLOAD_FILE_TYPES) ||
      ImageUploadTypes
  );

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
  { fileType, fileTypeId, isDefault, request }: any,
  _event: any
) {
  const { post, useUrl } = useApi();
  const path = filePath(fileType, fileTypeId, isDefault);
  return post({
    url: useUrl(path),
    data: request,
    withAccessToken: true
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  getImage,
  check,
  upload
};
