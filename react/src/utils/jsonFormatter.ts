// TypeScript port of Karabiner-Elements' json_utility::dump formatting rules.
// Keep this implementation in sync with the original when its rules change:
// https://github.com/pqrs-org/Karabiner-Elements/blob/main/src/share/json_utility.hpp

const forceMultiLineArrayObjectKeys = new Set([
  "bundle_identifiers",
  "description_notes",
  "game_pad_stick_horizontal_wheel_formula",
  "game_pad_stick_vertical_wheel_formula",
  "game_pad_stick_x_formula",
  "game_pad_stick_y_formula",
]);

const indentSize = 4;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isMultiLine = (value: unknown, parentObjectKey?: string): boolean => {
  if (isObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return false;
    if (entries.length === 1) {
      const [key, child] = entries[0];
      return isMultiLine(child, key);
    }
    return true;
  }

  if (Array.isArray(value)) {
    if (
      parentObjectKey !== undefined &&
      forceMultiLineArrayObjectKeys.has(parentObjectKey)
    ) {
      return true;
    }
    if (value.length === 0) return false;
    if (value.length === 1) return isMultiLine(value[0]);
    return value.some((child) => isObject(child) || Array.isArray(child));
  }

  return false;
};

const indent = (level: number) => " ".repeat(indentSize * level);

const formatValue = (
  value: unknown,
  parentObjectKey?: string,
  indentLevel = 0,
): string => {
  if (isObject(value)) {
    const entries = Object.entries(value);
    if (!isMultiLine(value, parentObjectKey)) {
      if (entries.length === 0) return "{}";

      const [key, child] = entries[0];
      return `{ ${JSON.stringify(key)}: ${formatValue(
        child,
        key,
        indentLevel + 1,
      )} }`;
    }

    return `{
${entries
  .map(
    ([key, child]) =>
      `${indent(indentLevel + 1)}${JSON.stringify(key)}: ${formatValue(
        child,
        key,
        indentLevel + 1,
      )}`,
  )
  .join(",\n")}
${indent(indentLevel)}}`;
  }

  if (Array.isArray(value)) {
    if (!isMultiLine(value, parentObjectKey)) {
      return `[${value
        .map((child) => formatValue(child, undefined, indentLevel + 1))
        .join(", ")}]`;
    }

    return `[
${value
  .map(
    (child) =>
      `${indent(indentLevel + 1)}${formatValue(
        child,
        undefined,
        indentLevel + 1,
      )}`,
  )
  .join(",\n")}
${indent(indentLevel)}]`;
  }

  const result = JSON.stringify(value);
  if (result === undefined) {
    throw new TypeError("The value is not JSON-serializable");
  }
  return result;
};

export const formatJson = (value: unknown): string => formatValue(value);
