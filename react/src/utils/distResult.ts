import type { CategoryObject, KarabinerFileObject } from "../types";

export type DistResult = {
  index: CategoryObject[];
  example: CategoryObject[];
  search_suggestions: string[];
  revision: string;
  updatedAt: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOptionalString = (value: unknown) =>
  value === undefined || typeof value === "string";

const isOptionalStringArray = (value: unknown) =>
  value === undefined ||
  (Array.isArray(value) && value.every((item) => typeof item === "string"));

const isRule = (value: unknown) =>
  isRecord(value) &&
  isOptionalString(value.description) &&
  isOptionalStringArray(value.description_notes) &&
  !("available_since" in value);

const isKarabinerFile = (value: unknown): value is KarabinerFileObject => {
  if (!isRecord(value) || typeof value.path !== "string") return false;

  const json = value.json;
  if (!isRecord(json)) return false;

  return (
    isOptionalString(json.title) &&
    isOptionalString(json.author) &&
    isOptionalStringArray(json.maintainers) &&
    (json.rules === undefined ||
      (Array.isArray(json.rules) && json.rules.every(isRule))) &&
    isOptionalString(value.extra_description_path) &&
    isOptionalString(value.extra_description_text)
  );
};

const isCategory = (value: unknown): value is CategoryObject =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  Array.isArray(value.files) &&
  value.files.every(isKarabinerFile);

const isUnixTimestamp = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  Number.isFinite(new Date(value * 1000).getTime());

export const isDistResult = (value: unknown): value is DistResult =>
  isRecord(value) &&
  Array.isArray(value.index) &&
  value.index.every(isCategory) &&
  Array.isArray(value.example) &&
  value.example.every(isCategory) &&
  Array.isArray(value.search_suggestions) &&
  value.search_suggestions.every(
    (suggestion) => typeof suggestion === "string",
  ) &&
  typeof value.revision === "string" &&
  isUnixTimestamp(value.updatedAt);
