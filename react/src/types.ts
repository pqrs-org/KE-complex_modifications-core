export type CategoryObject = {
  readonly id: string;
  readonly name: string;
  readonly files: readonly KarabinerJsonFileObject[];
};

export type KarabinerJsonFileObject = {
  readonly path: string;
  readonly json: {
    readonly title?: string;
    readonly maintainers?: readonly string[];
    readonly author?: string;
    readonly rules?: readonly {
      readonly description?: string;
      readonly available_since?: string;
    }[];
  };
  readonly extra_description_path?: string;
  readonly extra_description_text?: string;
};
