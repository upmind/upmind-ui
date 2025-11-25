// ---internal
import { Client } from "../../session";
import { CustomField } from "../customFields";
import { ProfileField, useBrand, useI18n } from "../../";

// --- utils
import { map, find, get } from "lodash-es";

export function mapProfileFields(
  client: Client,
  fields: CustomField[]
): ProfileField[] {
  const { t } = useI18n();
  const { languages } = useBrand();

  return [
    {
      id: "firstName",
      code: "firstName",
      title: t("form.firstname.label"),
      value: client.firstname,
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
      value: client.lastname,
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
        value: find(client.customFields || [], ["field_id", customField.id])
          ?.value,
        meta: { ...customField.meta, isCustomField: true }
      };
    })
  ];
}

export function mapIProfileFields(data: any): any {
  // change
  return {
    ...(!!data.firstName ? { firstname: data.firstName } : {}),
    ...(!!data.lastName ? { lastname: data.lastName } : {}),
    ...(!!data.publicName ? { public_name: data.publicName } : {}),
    ...(!!data.language
      ? {
          interface_language_id: data.language,
          document_language_id: data.language
        }
      : {}),
    ...(!!data.customFields ? { custom_fields: data.customFields } : {})
  } as any; // change
}
