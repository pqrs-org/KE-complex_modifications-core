import type { CategoryObject, KarabinerJsonFileObject } from "../types";

export type DistResult = {
  index: CategoryObject[];
  example: CategoryObject[];
  revision: string;
  updatedAt: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOptionalString = (value: unknown) =>
  value === undefined || typeof value === "string";

const isRule = (value: unknown) =>
  isRecord(value) &&
  isOptionalString(value.description) &&
  isOptionalString(value.available_since);

const isJsonFile = (value: unknown): value is KarabinerJsonFileObject => {
  if (!isRecord(value) || typeof value.path !== "string") return false;

  const json = value.json;
  if (!isRecord(json)) return false;

  return (
    isOptionalString(json.title) &&
    isOptionalString(json.author) &&
    (json.maintainers === undefined ||
      (Array.isArray(json.maintainers) &&
        json.maintainers.every(
          (maintainer) => typeof maintainer === "string",
        ))) &&
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
  value.files.every(isJsonFile);

export const isDistResult = (value: unknown): value is DistResult =>
  isRecord(value) &&
  Array.isArray(value.index) &&
  value.index.every(isCategory) &&
  Array.isArray(value.example) &&
  value.example.every(isCategory) &&
  typeof value.revision === "string" &&
  typeof value.updatedAt === "number" &&
  Number.isFinite(value.updatedAt);
