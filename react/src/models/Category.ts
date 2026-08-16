import type { CategoryObject } from "../types";
import { KarabinerJsonFile } from "./KarabinerJsonFile";

export const SEARCH_RESULT_CATEGORY_ID = "__search_result__";

export class Category {
  readonly object: CategoryObject;
  readonly files: readonly KarabinerJsonFile[];

  constructor(object: CategoryObject) {
    this.object = object;
    this.files = object.files.map((file) => new KarabinerJsonFile(file));
  }
}
