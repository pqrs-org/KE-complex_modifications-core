import type { CategoryObject } from "../types";
import { KarabinerJsonFile } from "./KarabinerJsonFile";

export class Category {
  readonly object: CategoryObject;
  readonly files: KarabinerJsonFile[];

  constructor(object: CategoryObject) {
    this.object = object;
    this.files = object.files.map((file) => new KarabinerJsonFile(file));
  }
}
