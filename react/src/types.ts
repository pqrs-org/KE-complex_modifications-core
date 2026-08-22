export type CategoryObject = {
  readonly id: string;
  readonly name: string;
  readonly files: readonly KarabinerFileObject[];
};

export type KarabinerFileObject = {
  readonly path: string;
  readonly ruleset_json_path?: string;
  readonly metadata: {
    readonly title?: string;
    readonly maintainers?: readonly string[];
    readonly author?: string;
    readonly rules?: readonly {
      readonly description?: string;
      readonly description_notes?: readonly string[];
    }[];
  };
  readonly extra_description_path?: string;
  readonly extra_description_text?: string;
};
