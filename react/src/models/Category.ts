import type { CategoryObject } from "../types";
import { KarabinerFile } from "./KarabinerFile";

export const SEARCH_RESULT_CATEGORY_ID = "__search_result__";

export class Category {
  readonly object: CategoryObject;
  readonly files: readonly KarabinerFile[];

  constructor(object: CategoryObject) {
    this.object = object;
    this.files = object.files.map((file) => new KarabinerFile(file));
  }
}
