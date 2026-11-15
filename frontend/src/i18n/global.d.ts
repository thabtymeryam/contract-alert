// Type-checks translation keys: t("contracts.title") fails to compile if the key is missing from en.json.
type Messages = typeof import("./messages/en.json");

declare interface IntlMessages extends Messages {}
