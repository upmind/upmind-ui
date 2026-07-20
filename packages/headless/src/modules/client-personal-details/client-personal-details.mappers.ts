/** @internal */
import { useBrand } from "../brand";
import { useI18n } from "../system-localisation";
import { map, find, get, omitBy, isEmpty, isNil, isString } from "lodash-es";
import type {
  FieldsModel,
  ProfileField
} from "./client-personal-details.types";
import type { CustomField } from "../client-custom-fields";
import type { SessionUser } from "../session-store";
import type { IClient } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export function mapProfileFields(
  client: SessionUser,
  fields: CustomField[]
): ProfileField[] {
  const { t } = useI18n();
  const { languages } = useBrand();
  return [
    {
      id: "firstName",
      code: "firstName",
      title: t("form.firstname.label"),
      value: client.firstName,
      meta: {
        isReadOnly: false,
        isDisabled: false,
        isCustomField: false,
        isRequired: false
      }
    },
    {
      id: "lastName",
      code: "lastName",
      title: t("form.lastname.label"),
      value: client.lastName,
      meta: {
        isReadOnly: false,
        isDisabled: false,
        isCustomField: false,
        isRequired: false
      }
    },
    {
      id: "publicName",
      code: "publicName",
      title: t("form.publicName.label"),
      value: client.publicName,
      meta: {
        isReadOnly: false,
        isDisabled: false,
        isCustomField: false,
        isRequired: false
      }
    },
    {
      id: "language",
      code: "language",
      title: t("form.language.label"),
      value: get(find(languages.value, ["id", client.language]), "language"),
      meta: {
        isReadOnly: false,
        isDisabled: false,
        isCustomField: false,
        isRequired: true
      }
    },

    ...map(fields, (customField: CustomField) => {
      return {
        id: customField.id,
        code: customField.code,
        title: customField.name,
        value: mapCustomFieldValue(
          find(client.customFields || [], ["field_id", customField.id])?.value,
          customField
        ),

        meta: { ...customField.meta, isCustomField: true }
      };
    })
  ];
}

export function mapCustomFieldValue(value: any, field?: CustomField): any {
  if (!field) return value;
  switch (field.type) {
    case "number":
      return Number(value);

    case "date":
      return value; // TODO: date parsing

    case "boolean":
    case "tick_box":
      return isString(value)
        ? value === "true" || value === "1" || false
        : Boolean(value);

    case "string":
    default:
      return String(value);
  }
}

export function mapIProfileFields(data: FieldsModel): Partial<IClient> {
  return omitBy(
    {
      firstname: data.firstName,
      lastname: data.lastName,
      public_name: data.publicName,
      interface_language_id: data.language,
      document_language_id: data.language,
      custom_fields: omitBy(data.customFields, isNil)
    },
    isEmpty
  ) as Partial<IClient>;
}
